// src/favorite/favorite.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Favorite } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, productId: string): Promise<Favorite> {
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new NotFoundException(`Usuário com ID '${userId}' não encontrado.`);
    }

    const productExists = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!productExists) {
      throw new NotFoundException(`Produto com ID '${productId}' não encontrado.`);
    }

    try {
      const newFavorite = await this.prisma.favorite.create({
        data: {
          userId,
          productId,
        },
        include: {
          product: true, // incluir detalhes do produto na resposta da criação
        },
      });
      return newFavorite;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Este produto já foi favoritado por este usuário.');
        }
      }
      console.error(`Error favoriting product ${productId} for user ${userId}:`, error);
      throw new InternalServerErrorException('Não foi possível adicionar aos favoritos.');
    }
  }

  async findOneByFavoriteId(favoriteId: string): Promise<Favorite> {
    try {
      const favorite = await this.prisma.favorite.findUnique({
        where: { id: favoriteId },
        include: {
          product: true,
        },
      });

      if (!favorite) {
        throw new NotFoundException(`Registro de favorito com ID '${favoriteId}' não encontrado.`);
      }
      return favorite;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching favorite with ID ${favoriteId}:`, error);
      throw new InternalServerErrorException('Erro ao buscar o registro de favorito.');
    }
  }

  async findAllByUserId(userId: string): Promise<Favorite[]> {
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new NotFoundException(`Usuário com ID '${userId}' não encontrado.`);
    }

    try {
      return await this.prisma.favorite.findMany({
        where: { userId },
        include: {
          product: true,
        },
      });
    } catch (error) {
      console.error(`Error fetching favorites for user ${userId}:`, error);
      throw new InternalServerErrorException('Erro ao buscar os favoritos.');
    }
  }

  async removeByUserAndProduct(userId: string, productId: string): Promise<void> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException(
        `Favorito não encontrado para o usuário ID '${userId}' e produto ID '${productId}'.`,
      );
    }

    try {
      await this.prisma.favorite.delete({
        where: {
          id: favorite.id,
        },
      });
    } catch (error) {
      console.error(`Error removing favorite for user ${userId}, product ${productId}:`, error);
      throw new InternalServerErrorException('Erro ao remover o favorito.');
    }
  }
}
