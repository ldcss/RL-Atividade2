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
import { ApiTags, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Favorite } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedUserPayload {
  id: string;
  email: string;
}

@ApiTags('Favorite')
@Controller('favorite')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateFavoriteDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  async create(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<Favorite> {
    const userId = req.user.id;
    const favorite = await this.favoriteService.create(userId, createFavoriteDto.productId);
    return favorite;
  }

  @Get()
  @ApiParam({ name: 'userId', description: 'ID do Usuário (UUID)', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  async findAllByUser(
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<Favorite[]> {
    const userId = req.user.id;
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
    const favorite = await this.favoriteService.findOneByFavoriteId(favoriteId);
    return favorite;
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'productId',
    description: 'ID do produto (UUID) a ser removido dos favoritos.',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<void> {
    const userId = req.user.id;
    await this.favoriteService.removeByUserAndProduct(userId, productId);
  }
}
