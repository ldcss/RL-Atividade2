import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderWithDetails } from './types/order-with-details';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo pedido' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pedido criado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos (ex: itens vazios, quantidade inválida).',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário ou Produto não encontrado.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderWithDetails> {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar todos os pedidos de um usuário específico' })
  @ApiParam({ name: 'userId', description: 'ID do Usuário (UUID)', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pedidos do usuário retornada com sucesso.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async findUserOrders(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<OrderWithDetails[]> {
    return this.orderService.findUserOrders(userId);
  }

  @Get('/order')
  @ApiOperation({ summary: 'Buscar detalhes de um pedido específico' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes do pedido retornados com sucesso.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pedido não encontrado.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Acesso negado a este pedido.' }) // Se requestingUserId for usado
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async findOrderById(
    @Query('orderId', ParseUUIDPipe) orderId: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ): Promise<OrderWithDetails> {
    return this.orderService.findOrderById(orderId, userId);
  }

  @Patch(':orderId/status')
  @ApiOperation({ summary: 'Atualizar o status de um pedido (geralmente para administradores)' })
  @ApiParam({ name: 'orderId', description: 'ID do Pedido (UUID) a ser atualizado', type: String })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status do pedido atualizado com sucesso.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pedido não encontrado.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status inválido ou transição de status não permitida.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno no servidor.',
  })
  async updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderWithDetails> {
    return this.orderService.updateOrderStatus(orderId, updateOrderStatusDto);
  }
}
