import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Review } from '@prisma/client';
import { AuthenticatedUserPayload } from 'src/auth/type/authenticated-user.payload';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma nova avaliação para um produto comprado' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Avaliação criada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Não autorizado a avaliar este produto (não comprou/recebeu).',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto não encontrado.' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Produto já avaliado por este usuário.',
  })
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<Review> {
    const userId = req.user.id;
    const review = await this.reviewService.create(userId, createReviewDto);
    return review;
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Listar todas as avaliações de um produto específico' })
  @ApiParam({ name: 'productId', description: 'ID do Produto (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de itens por página',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de avaliações do produto.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto não encontrado.' })
  async findAllByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ reviews: Review[]; total: number; currentPage: number; totalPages: number }> {
    const result = await this.reviewService.findAllByProduct(productId, page, limit);
    return {
      ...result,
      reviews: result.reviews,
    };
  }

  @Get('mine') // Rota para buscar as avaliações do usuário logado
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar todas as avaliações feitas pelo usuário logado' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de itens por página',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de suas avaliações.',
  })
  async findAllMyReviews(
    @Req() req: Request & { user: AuthenticatedUserPayload },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ reviews: Review[]; total: number; currentPage: number; totalPages: number }> {
    const userId = req.user.id;
    const result = await this.reviewService.findAllByUser(userId, page, limit);
    return {
      ...result,
      reviews: result.reviews,
    };
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Buscar uma avaliação específica pelo seu ID' })
  @ApiParam({ name: 'reviewId', description: 'ID da Avaliação (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detalhes da avaliação.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Avaliação não encontrada.' })
  async findOne(@Param('reviewId', ParseUUIDPipe) reviewId: string): Promise<Review> {
    const review = await this.reviewService.findOne(reviewId);
    return review;
  }

  @Patch(':reviewId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Atualizar uma avaliação feita pelo usuário logado' })
  @ApiParam({
    name: 'reviewId',
    description: 'ID da Avaliação (UUID) a ser atualizada',
    type: String,
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avaliação atualizada com sucesso.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Avaliação não encontrada.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Você não tem permissão para atualizar esta avaliação.',
  })
  async update(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<Review> {
    const userId = req.user.id;
    const updatedReview = await this.reviewService.update(reviewId, userId, updateReviewDto);
    return updatedReview;
  }

  @Delete(':reviewId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar uma avaliação feita pelo usuário logado' })
  @ApiParam({
    name: 'reviewId',
    description: 'ID da Avaliação (UUID) a ser deletada',
    type: String,
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Avaliação deletada com sucesso.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Avaliação não encontrada.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Você não tem permissão para deletar esta avaliação.',
  })
  async remove(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<void> {
    const userId = req.user.id;
    await this.reviewService.remove(reviewId, userId);
  }
}
