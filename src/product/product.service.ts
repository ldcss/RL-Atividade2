import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { title, description, price, originalPrice, category } = createProductDto;

    // Validação de Regra de Negócio: originalPrice >= price
    if (originalPrice !== undefined && originalPrice !== null && price > originalPrice) {
      throw new BadRequestException('O preço de venda não pode ser maior que o preço original.');
    }

    try {
      const newProduct = await this.prisma.product.create({
        data: {
          title,
          description,
          price,
          originalPrice,
          category,
        },
      });
      return newProduct;
    } catch (error) {
      throw new InternalServerErrorException('Não foi possível criar o produto.');
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.prisma.product.findMany();
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw new InternalServerErrorException('Erro ao buscar produtos.');
    }
  }

  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new NotFoundException(`Produto com ID '${id}' não encontrado.`);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching product with ID ${id}:`, error);
      throw new InternalServerErrorException('Erro ao buscar o produto.');
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Busca o produto primeiro para garantir que ele exista
    const existingProduct = await this.findOne(id);

    const dataForPrismaUpdate: Prisma.ProductUpdateInput = {};

    if (updateProductDto.title !== undefined) {
      dataForPrismaUpdate.title = updateProductDto.title;
    }
    if (updateProductDto.description !== undefined) {
      dataForPrismaUpdate.description = updateProductDto.description;
    }
    if (updateProductDto.price !== undefined) {
      if (updateProductDto.price < 0) {
        throw new BadRequestException('O preço não pode ser negativo.');
      }
      dataForPrismaUpdate.price = updateProductDto.price;
    }
    if (updateProductDto.originalPrice !== undefined) {
      if (updateProductDto.originalPrice !== null && updateProductDto.originalPrice < 0) {
        throw new BadRequestException('O preço original não pode ser negativo.');
      }
      dataForPrismaUpdate.originalPrice = updateProductDto.originalPrice;
    }
    if (updateProductDto.category !== undefined) {
      if (
        typeof updateProductDto.category !== 'string' ||
        updateProductDto.category.trim() === ''
      ) {
        throw new BadRequestException('A categoria, se fornecida, não pode ser uma string vazia.');
      }
      dataForPrismaUpdate.category = updateProductDto.category;
    }

    // Validação de Regra de Negócio: originalPrice >= price, considerando os valores atuais ou atualizados
    const finalPrice =
      dataForPrismaUpdate.price !== undefined
        ? (dataForPrismaUpdate.price as number)
        : existingProduct.price;
    let finalOriginalPrice =
      dataForPrismaUpdate.originalPrice !== undefined
        ? (dataForPrismaUpdate.originalPrice as number)
        : existingProduct.originalPrice;

    // Se originalPrice está sendo explicitamente definido como null
    if (dataForPrismaUpdate.originalPrice === null) {
      finalOriginalPrice = null;
    }

    if (finalOriginalPrice !== null && finalPrice > finalOriginalPrice) {
      throw new BadRequestException('O preço de venda não pode ser maior que o preço original.');
    }

    if (Object.keys(dataForPrismaUpdate).length === 0) {
      return existingProduct;
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: dataForPrismaUpdate,
      });
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw new InternalServerErrorException('Erro ao atualizar o produto.');
    }
  }

  async remove(id: string): Promise<Product> {
    // já lança NotFoundException se não encontrar
    await this.findOne(id);

    try {
      // 'Favorite' e 'CartItem' têm onDelete: Cascade para productId.
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Produto está em um pedido
          console.error(
            `Foreign key constraint failed for product ID ${id}:`,
            error.meta?.field_name,
          );
          throw new ConflictException(
            `Não é possível deletar o produto com ID '${id}' pois ele está associado a pedidos existentes e não pode ser removido do histórico.`,
          );
        }
      }
      console.error(`Error deleting product with ID ${id}:`, error);
      throw new InternalServerErrorException('Erro ao deletar o produto.');
    }
  }
}
