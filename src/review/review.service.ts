import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Prisma, Review } from '@prisma/client';
import { UserService } from '../user/user.service';
import { ProductService } from '../product/product.service';
import { OrderStatus } from '../order/types/order-status';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private productService: ProductService,
  ) {}

  private async checkUserEligibilityToReview(userId: string, productId: string): Promise<void> {
    await this.userService.findOne(userId);

    await this.productService.findOne(productId);

    // verifica se o usuário comprou e o pedido foi entregue
    const orderCount = await this.prisma.order.count({
      where: {
        userId: userId,
        status: OrderStatus.DELIVERED,
        items: {
          some: {
            productId: productId,
          },
        },
      },
    });

    if (orderCount === 0) {
      throw new ForbiddenException(
        'Você só pode avaliar produtos que comprou e que já foram entregues.',
      );
    }
  }

  async create(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    const { productId, rating, comment } = createReviewDto;

    // verifica se o usuário é elegível para avaliar este produto
    await this.checkUserEligibilityToReview(userId, productId);

    try {
      return await this.prisma.review.create({
        data: {
          userId,
          productId,
          rating,
          comment,
        },
        include: { user: { select: { id: true, name: true, email: true } }, product: true },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Você já avaliou este produto.');
      }
      console.error(`Error creating review for product ${productId} by user ${userId}:`, error);
      throw new InternalServerErrorException('Não foi possível criar a avaliação.');
    }
  }

  async findAllByProduct(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ reviews: Review[]; total: number; currentPage: number; totalPages: number }> {
    await this.productService.findOne(productId); //garante que produto existe

    const skip = (page - 1) * limit;
    try {
      const [reviews, total] = await this.prisma.$transaction([
        this.prisma.review.findMany({
          where: { productId },
          include: {
            user: { select: { id: true, name: true, email: true } }, // seleciona campos específicos do usuário
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.review.count({ where: { productId } }),
      ]);
      return {
        reviews,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      throw new InternalServerErrorException('Erro ao buscar avaliações do produto.');
    }
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ reviews: Review[]; total: number; currentPage: number; totalPages: number }> {
    await this.userService.findOne(userId); // Garante que o usuário existe

    const skip = (page - 1) * limit;
    try {
      const [reviews, total] = await this.prisma.$transaction([
        this.prisma.review.findMany({
          where: { userId },
          include: {
            product: true, // inclui detalhes do produto avaliado
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.review.count({ where: { userId } }),
      ]);
      return {
        reviews,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error(`Error fetching reviews for user ${userId}:`, error);
      throw new InternalServerErrorException('Erro ao buscar suas avaliações.');
    }
  }

  async findOne(reviewId: string): Promise<Review> {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: true,
        },
      });
      if (!review) {
        throw new NotFoundException(`Avaliação com ID '${reviewId}' não encontrada.`);
      }
      return review;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error fetching review ${reviewId}:`, error);
      throw new InternalServerErrorException('Erro ao buscar a avaliação.');
    }
  }

  async update(
    reviewId: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.findOne(reviewId);

    if (review.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para atualizar esta avaliação.');
    }

    // prepara os dados para atualização, apenas os campos fornecidos no DTO
    const dataToUpdate: Prisma.ReviewUpdateInput = {};
    if (updateReviewDto.rating !== undefined) {
      if (updateReviewDto.rating < 1 || updateReviewDto.rating > 5) {
        throw new BadRequestException('A nota deve ser entre 1 e 5.');
      }
      dataToUpdate.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.hasOwnProperty('comment')) {
      // permitir definir comentario como null ou string vazia
      if (
        updateReviewDto.comment !== null &&
        typeof updateReviewDto.comment === 'string' &&
        updateReviewDto.comment.length > 1000
      ) {
        throw new BadRequestException('O comentário não pode exceder 1000 caracteres.');
      }
      dataToUpdate.comment = updateReviewDto.comment;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      // nenhum campo válido para atualização foi fornecido, retorna a avaliação existente.
      return review;
    }

    try {
      return await this.prisma.review.update({
        where: { id: reviewId },
        data: dataToUpdate,
        include: { user: { select: { id: true, name: true, email: true } }, product: true },
      });
    } catch (error) {
      console.error(`Error updating review ${reviewId}:`, error);
      throw new InternalServerErrorException('Erro ao atualizar a avaliação.');
    }
  }

  async remove(reviewId: string, userId: string): Promise<void> {
    const review = await this.findOne(reviewId); // findOne já lança NotFoundException

    if (review.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para remover esta avaliação.');
    }

    try {
      await this.prisma.review.delete({
        where: { id: reviewId },
      });
    } catch (error) {
      console.error(`[ReviewService - remove] Error deleting review ${reviewId}:`, error);
      throw new InternalServerErrorException('Erro ao remover a avaliação.');
    }
  }
}
