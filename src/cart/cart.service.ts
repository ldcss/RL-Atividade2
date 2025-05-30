import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { UserService } from '../user/user.service';
import { Prisma } from '@prisma/client'; // Tipos do Prisma
import { PrismaService } from 'prisma/prisma.service';
import { CartWithDetails } from './dto/cart-with-details.dto';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private productService: ProductService,
  ) {}

  // retorna o carrinho de um usuário, incluindo seus itens e os detalhes dos produtos.

  private async findOrCreateCartByUserId(userId: string): Promise<CartWithDetails> {
    // verifica se o usuário existe
    await this.userService.findOne(userId);

    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            product: {
              title: 'asc',
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }
    return cart as CartWithDetails;
  }

  async getCartByUserId(userId: string): Promise<CartWithDetails> {
    return this.findOrCreateCartByUserId(userId);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartWithDetails> {
    if (quantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }

    // checa se o produto existe
    await this.productService.findOne(productId);

    // recebe ou cria o carrinho do usuário
    const cart = await this.findOrCreateCartByUserId(userId);

    // verifica se o item já ta no carrinho
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          // usa o discriminador
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // atualiza a quantidade
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // cria um novo item no carrinho
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // 4. Retorna o carrinho atualizado com todos os itens e produtos
    return this.getCartByUserId(userId);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartWithDetails> {
    // obtem o carrinho do usuário
    const cart = await this.findOrCreateCartByUserId(userId);

    // encontra item específico no carrinho
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException(
        `Produto com ID '${productId}' não encontrado no carrinho do usuário.`,
      );
    }

    if (quantity <= 0) {
      // se a quantidade for menor qou igual a zero, remove o item
      await this.prisma.cartItem.delete({
        where: { id: cartItem.id },
      });
    } else {
      await this.prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
      });
    }

    return this.getCartByUserId(userId);
  }

  async removeItem(userId: string, productId: string): Promise<CartWithDetails> {
    const cart = await this.findOrCreateCartByUserId(userId);

    // tenta deletar o item diretamente usando a chave composta, verificando se o item existe
    try {
      await this.prisma.cartItem.delete({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(
          `Produto com ID '${productId}' não encontrado no carrinho para remoção.`,
        );
      }
      console.error(`Error removing item ${productId} from cart ${cart.id}:`, error);
      throw new InternalServerErrorException('Erro ao remover o item do carrinho.');
    }

    // retorna o carrinho atualizado
    return this.getCartByUserId(userId);
  }

  async clearCart(userId: string): Promise<CartWithDetails> {
    const cart = await this.findOrCreateCartByUserId(userId);

    // remove todos os itens do carrinho
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // retorna carrinho vazio
    return this.getCartByUserId(userId);
  }
}
