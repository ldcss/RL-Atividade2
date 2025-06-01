import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'ID do produto a ser favoritado (UUID).',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef',
    type: String,
  })
  @IsString({ message: 'O ID do produto deve ser uma string.' })
  @IsNotEmpty({ message: 'O ID do produto não pode ser vazio.' })
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID v4 válido.' })
  productId: string;
}
