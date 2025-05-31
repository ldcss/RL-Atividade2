import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID do usuário que está fazendo o pedido (UUID). (Temporário até a autenticação)',
    example: 'a1b2c3d4-e5b6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'O ID do usuário deve ser um UUID válido.' })
  userId: string;

  @ApiProperty({
    description: 'Lista de itens para o pedido.',
    type: () => [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty({ message: 'O pedido deve conter pelo menos um item.' })
  items: CreateOrderItemDto[];
}
