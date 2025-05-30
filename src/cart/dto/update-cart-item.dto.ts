import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'ID do produto no carrinho cuja quantidade será atualizada (UUID).',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido.' })
  productId: string;

  @ApiProperty({
    description: 'Nova quantidade do produto. Se for 0 ou menor, o item será removido.',
    example: 2,
    type: Number,
    minimum: 0,
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(0, { message: 'A quantidade não pode ser negativa.' })
  @IsNotEmpty()
  quantity: number;
}
