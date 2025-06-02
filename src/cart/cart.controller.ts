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
} from '@nestjs/common';
import { CartService } from './cart.service';
import { ManageCartItemDto } from './dto/manage-cart-item.dto';
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { CartWithDetails } from './dto/cart-with-details.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiParam({ name: 'userId', description: 'ID do Usuário (UUID)', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carrinho do usuário retornado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário com o ID fornecido não encontrado.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async getCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<CartWithDetails> {
    const cartWithDetails = await this.cartService.getCartByUserId(userId);
    return cartWithDetails;
  }

  @Post('items')
  @ApiBody({ type: ManageCartItemDto })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiOperation({
    summary: 'Adicionar um item ao carrinho de um usuário ou incrementar quantidade.',
    description:
      'Adiciona um produto com uma quantidade específica ao carrinho do usuário. Se o item já existir, incrementa a quantidade. O userId é fornecido no corpo (temporariamente).',
  })
  @ApiBody({
    type: ManageCartItemDto,
    description: 'Dados para adicionar/incrementar item, incluindo userId, productId e quantity.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item adicionado/quantidade incrementada no carrinho com sucesso.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário ou Produto não encontrado.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos (ex: quantidade <= 0 ou ID mal formatado no DTO).',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async addItemToCart(@Body() manageCartItemDto: ManageCartItemDto): Promise<CartWithDetails> {
    const { userId, productId, quantity } = manageCartItemDto;
    const cartWithDetails = await this.cartService.addItem(userId, productId, quantity);
    return cartWithDetails;
  }

  @Patch('items')
  @ApiOperation({
    summary: 'Atualizar a quantidade de um item no carrinho de um usuário.',
    description:
      'Define a quantidade de um produto específico no carrinho do usuário. Se a quantidade for <= 0, o item é removido. O userId é fornecido no corpo.',
  })
  @ApiBody({
    type: ManageCartItemDto,
    description: 'Dados para atualizar quantidade, incluindo userId, productId e a nova quantity.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quantidade do item atualizada com sucesso (ou item removido se quantidade <= 0).',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário, Produto ou Item do carrinho não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos (ex: quantidade < 0 ou ID mal formatado no DTO).',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async updateCartItemQuantity(
    @Body() manageCartItemDto: ManageCartItemDto,
  ): Promise<CartWithDetails> {
    const { userId, productId, quantity } = manageCartItemDto;
    const cartWithDetails = await this.cartService.updateItemQuantity(userId, productId, quantity);
    return cartWithDetails;
  }

  @Delete('items')
  @ApiOperation({
    summary: 'Remover um item específico do carrinho de um usuário.',
    description: 'Remove um produto do carrinho do usuário. IDs são fornecidos via query params.',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'ID do usuário (UUID)',
    type: String,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiQuery({
    name: 'productId',
    required: true,
    description: 'ID do produto a ser removido (UUID)',
    type: String,
    example: 'c1d2e3f4-a5b6-7890-1234-567890efghij',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removido do carrinho com sucesso, retorna o carrinho atualizado.',
    // type: CartEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário, Produto ou Item do carrinho não encontrado.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
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
  @ApiOperation({
    summary: 'Limpar todos os itens do carrinho de um usuário.',
    description:
      'Remove todos os itens do carrinho do usuário especificado. Com autenticação completa, o ID do usuário viria do token.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do Usuário (UUID) cujo carrinho será limpo',
    type: String,
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carrinho limpo com sucesso, retorna o carrinho (agora vazio).',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async clearUserCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<CartWithDetails> {
    const cartWithDetails = await this.cartService.clearCart(userId);
    return cartWithDetails;
  }
}
