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
} from '@nestjs/common';
import { CartService } from './cart.service';
import { ManageCartItemDto } from './dto/manage-cart-item.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CartWithDetails } from './dto/cart-with-details.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiParam({ name: 'userId', description: 'ID do Usuário (UUID)', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  async getCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<CartWithDetails> {
    const cartWithDetails = await this.cartService.getCartByUserId(userId);
    return cartWithDetails;
  }

  @Post('items')
  @ApiBody({ type: ManageCartItemDto })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  async addItemToCart(@Body() manageCartItemDto: ManageCartItemDto): Promise<CartWithDetails> {
    const { userId, productId, quantity } = manageCartItemDto;
    const cartWithDetails = await this.cartService.addItem(userId, productId, quantity);
    return cartWithDetails;
  }

  @Patch('items')
  @ApiBody({ type: ManageCartItemDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quantidade do item atualizada.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário, Carrinho ou Item não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos (ex: quantidade < 0).',
  })
  async updateCartItemQuantity(
    @Body() manageCartItemDto: ManageCartItemDto,
  ): Promise<CartWithDetails> {
    const { userId, productId, quantity } = manageCartItemDto;
    const cartWithDetails = await this.cartService.updateItemQuantity(userId, productId, quantity);
    return cartWithDetails;
  }

  @Delete('items')
  @ApiQuery({ name: 'userId', required: true, description: 'ID do usuário (UUID)', type: String })
  @ApiQuery({
    name: 'productId',
    required: true,
    description: 'ID do produto a ser removido (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removido do carrinho.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário, Carrinho ou Item não encontrado.',
  })
  async removeCartItem(
    @Query('userId', ParseUUIDPipe) userId: string,
    @Query('productId', ParseUUIDPipe) productId: string,
  ): Promise<CartWithDetails> {
    const cartWithDetails = await this.cartService.removeItem(userId, productId);
    return cartWithDetails;
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    description: 'ID do Usuário (UUID) cujo carrinho será limpo',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  async clearUserCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<CartWithDetails> {
    const cartWithDetails = await this.cartService.clearCart(userId);
    return cartWithDetails;
  }
}
