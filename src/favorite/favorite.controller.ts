import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import {
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Favorite } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUserPayload } from 'src/auth/type/authenticated-user.payload';

ApiTags('Favorites');
@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar um produto aos favoritos do usuário logado' })
  @ApiBody({ type: CreateFavoriteDto, description: 'ID do produto a ser favoritado.' })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos (ex: ID do produto mal formatado).',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado ou usuário (do token) não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Este produto já foi favoritado por este usuário.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async create(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<Favorite> {
    const userId = req.user.id;
    const favorite = await this.favoriteService.create(userId, createFavoriteDto.productId);
    return favorite;
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os favoritos do usuário logado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de favoritos do usuário recuperada com sucesso.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário (do token) não encontrado.' })
  async findAllByUser(
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<Favorite[]> {
    const userId = req.user.id;
    const favorites = await this.favoriteService.findAllByUserId(userId);
    return favorites;
  }

  @Get(':favoriteId')
  @ApiOperation({
    summary: 'Buscar um registro de favorito específico pelo seu ID',
    description:
      'Retorna um registro de favorito específico. Nota: Atualmente não verifica se o favorito pertence ao usuário logado.',
  })
  @ApiParam({
    name: 'favoriteId',
    description: 'ID do registro de Favorito (UUID)',
    type: String,
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registro de favorito encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Registro de favorito com o ID fornecido não encontrado.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async findOneFavoriteRecord(
    @Param('favoriteId', ParseUUIDPipe) favoriteId: string,
  ): Promise<Favorite> {
    const favorite = await this.favoriteService.findOneByFavoriteId(favoriteId);
    return favorite;
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover um produto dos favoritos do usuário logado' })
  @ApiParam({
    name: 'productId',
    description: 'ID do produto (UUID) a ser removido dos favoritos.',
    type: String,
    format: 'uuid',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Favorito removido com sucesso.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Favorito não encontrado para este produto e usuário.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<void> {
    const userId = req.user.id;
    await this.favoriteService.removeByUserAndProduct(userId, productId);
  }
}
