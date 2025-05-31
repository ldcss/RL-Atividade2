import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OrderStatus } from '../types/order-status';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Novo status do pedido.',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(OrderStatus, { message: 'Status inválido fornecido.' })
  status: OrderStatus;
}
