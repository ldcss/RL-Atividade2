import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class ManageCartItemDto {
  @ApiProperty({
    description: 'ID do usuário proprietário do carrinho (UUID). (Temporário até a autenticação)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'O ID do usuário deve ser um UUID válido.' })
  userId: string;

  @ApiProperty({
    description: 'ID do produto (UUID).',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido.' })
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto. Para PATCH, se <= 0, o item é removido.',
    example: 1,
    type: Number,
    minimum: 0,
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(0, { message: 'A quantidade não pode ser negativa.' })
  @IsNotEmpty()
  quantity: number;
}
