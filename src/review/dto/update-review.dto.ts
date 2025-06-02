import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';
import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdateReviewDtoInternal extends PartialType(CreateReviewDto) {}

// DTO real para atualização, expondo apenas comment como opcionais
export class UpdateReviewDto {
  @ApiProperty({
    description: 'Nova nota da avaliação (de 1 a 5 estrelas).',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsInt({ message: 'A nota deve ser um número inteiro.' })
  @Min(1, { message: 'A nota mínima é 1.' })
  @Max(5, { message: 'A nota máxima é 5.' })
  rating: number;

  @ApiProperty({
    description: 'Novo comentário opcional sobre o produto.',
    example: 'Muito bom, mas a entrega demorou.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'O comentário deve ser uma string.' })
  @MaxLength(1000, { message: 'O comentário não pode exceder 1000 caracteres.' })
  comment?: string;
}
