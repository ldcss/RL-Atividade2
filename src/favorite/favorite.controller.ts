// src/favorite/favorite.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query, // Importar Query para o DELETE
  ParseUUIDPipe,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Favorite } from '@prisma/client';

@ApiTags('Favorite')
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateFavoriteDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  async create(@Body() createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    const favorite = await this.favoriteService.create(createFavoriteDto);
    return favorite;
  }

  @Get('user/:userId')
  @ApiParam({ name: 'userId', description: 'ID do Usuário (UUID)', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  async findAllByUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<Favorite[]> {
    const favorites = await this.favoriteService.findAllByUserId(userId);
    return favorites;
  }

  @Get(':favoriteId')
  @ApiParam({ name: 'favoriteId', description: 'ID do registro de Favorito (UUID)', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Registro de favorito não encontrado.',
  })
  async findOneFavoriteRecord(
    @Param('favoriteId', ParseUUIDPipe) favoriteId: string,
  ): Promise<Favorite> {
    const favorite = await this.favoriteService.findOneByFavoriteId(favoriteId); // Use o novo método do service
    return favorite;
  }

  @Delete() // Rota DELETE para /favorites?userId=...&productId=...
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'ID do usuário (UUID) do qual remover o favorito.',
  })
  @ApiQuery({
    name: 'productId',
    required: true,
    description: 'ID do produto (UUID) a ser removido dos favoritos.',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(
    @Query('userId', ParseUUIDPipe) userId: string,
    @Query('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    await this.favoriteService.removeByUserAndProduct(userId, productId);
  }
}
