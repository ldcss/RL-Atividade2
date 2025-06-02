// src/order/order.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException, // Para verificação de propriedade do pedido
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ProductService } from '../product/product.service';
import { CartService } from '../cart/cart.service'; // Para limpar o carrinho
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderWithDetails } from './types/order-with-details';
import { OrderStatus } from './types/order-status';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private productService: ProductService,
    private cartService: CartService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderWithDetails> {
    const { userId, items } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('O pedido deve conter pelo menos um item.');
    }

    //procura usuario
    await this.userService.findOne(userId);

    // valida, procura e calcula o total dos produtos
    let calculatedTotalAmount = 0;
    const orderItemsToCreateInput: Prisma.OrderItemCreateManyInput[] = [];

    for (const itemDto of items) {
      const product = await this.productService.findOne(itemDto.productId); // Lança NotFoundException se não existir
      if (itemDto.quantity <= 0) {
        throw new BadRequestException(
          `A quantidade para o produto '${product.title}' (ID: ${itemDto.productId}) deve ser positiva.`,
        );
      }
      const priceAtPurchase = product.price;
      calculatedTotalAmount += priceAtPurchase * itemDto.quantity;
      orderItemsToCreateInput.push({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        priceAtPurchase,
        orderId: '', // é preenchido após a criação do pedido
      });
    }

    // cria a comp
    const createdOrderWithItems = await this.prisma.$transaction(async tx => {
      // Cria o registro Order
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          totalAmount: calculatedTotalAmount, // totalAmount já calculado
        },
      });

      // Adiciona o orderId aos dados dos itens e cria os OrderItems
      const itemsWithOrderId = orderItemsToCreateInput.map(item => ({
        ...item,
        orderId: order.id,
      }));
      await tx.orderItem.createMany({
        data: itemsWithOrderId,
      });

      // Retorna o pedido com os dados incluídos para consistência do tipo de retorno
      // Não precisa mais de um update para totalAmount se já foi calculado corretamente.
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, title: true, description: true } },
            },
          },
        },
      });
    });

    if (!createdOrderWithItems) {
      // Isso não deveria acontecer se a transação foi bem-sucedida e não houve rollback
      throw new InternalServerErrorException(
        'Falha ao obter os detalhes do pedido após a criação.',
      );
    }

    // 4. Limpar o carrinho do usuário (fora da transação principal do pedido)
    try {
      await this.cartService.clearCart(userId);
    } catch (cartError) {
      // Logar este erro, mas o pedido já foi criado com sucesso.
      // Pode ser uma boa ideia ter um mecanismo de alerta ou retentativa para limpeza de carrinho.
      console.error(
        `[OrderService - createOrder] ALERTA: Falha ao limpar o carrinho do usuário ${userId} após criar o pedido ${createdOrderWithItems.id}:`,
        cartError,
      );
    }

    return createdOrderWithItems as OrderWithDetails;
  }

  async findUserOrders(userId: string): Promise<OrderWithDetails[]> {
    await this.userService.findOne(userId);

    try {
      const orders = await this.prisma.order.findMany({
        where: { userId },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, title: true, description: true } },
            },
            orderBy: {
              product: { title: 'asc' },
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Pedidos mais recentes primeiro
        },
      });
      return orders as OrderWithDetails[];
    } catch (error) {
      console.error(`Erro ao buscar pedidos para o usuário ${userId}:`, error);
      throw new InternalServerErrorException('Erro ao buscar os pedidos.');
    }
  }

  async findOrderById(orderId: string, requestingUserId?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, title: true, description: true } },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Pedido com ID '${orderId}' não encontrado.`);
      }

      // se um requestingUserId foi fornecido, verifica se o pedido pertence a ele
      if (requestingUserId && order.userId !== requestingUserId) {
        throw new ForbiddenException('Você não tem permissão para visualizar este pedido.');
      }

      return order as OrderWithDetails;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Erro ao buscar o pedido ${orderId}:`, error);
      throw new InternalServerErrorException('Erro ao buscar o pedido.');
    }
  }

  async updateOrderStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderWithDetails> {
    const { status } = updateOrderStatusDto;

    // 1. Verificar se o pedido existe
    const order = await this.findOrderById(orderId); // findOrderById já lança NotFoundException

    //impede um pedido entregue de ter status modificado
    if (order.status === OrderStatus.DELIVERED && status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Não é possível alterar o status de um pedido já entregue.');
    }

    try {
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, title: true, description: true } },
            },
          },
        },
      });
      return updatedOrder as OrderWithDetails;
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${orderId}:`, error);
      throw new InternalServerErrorException('Erro ao atualizar o status do pedido.');
    }
  }
}
