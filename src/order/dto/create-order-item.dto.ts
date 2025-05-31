import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'ID do produto a ser incluído no pedido (UUID).',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido.' })
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto.',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade deve ser pelo menos 1.' })
  @IsNotEmpty()
  quantity: number;
}
