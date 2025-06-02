import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID do produto a ser avaliado (UUID).',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsNotEmpty({ message: 'O ID do produto não pode ser vazio.' })
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID v4 válido.' })
  productId: string;

  @ApiProperty({
    description: 'Nota da avaliação (de 1 a 5 estrelas).',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'A nota deve ser um número inteiro.' })
  @Min(1, { message: 'A nota mínima é 1.' })
  @Max(5, { message: 'A nota máxima é 5.' })
  @IsNotEmpty({ message: 'A nota não pode ser vazia.' })
  rating: number;

  @ApiProperty({
    description: 'Comentário opcional sobre o produto.',
    example: 'Excelente produto, recomendo!',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'O comentário deve ser uma string.' })
  @MaxLength(1000, { message: 'O comentário não pode exceder 1000 caracteres.' })
  comment?: string;
}
