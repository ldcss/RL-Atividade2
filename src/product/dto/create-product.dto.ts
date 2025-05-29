import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Título do produto.',
    example: 'Smartphone XYZ',
    type: String,
    maxLength: 255,
  })
  @IsString({ message: 'O título deve ser uma string.' })
  @IsNotEmpty({ message: 'O título não pode ser vazio.' })
  @MaxLength(255, { message: 'O título não pode exceder 255 caracteres.' })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do produto (opcional).',
    example: 'Um smartphone com câmera de alta resolução e bateria de longa duração.',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string.' })
  description?: string;

  @ApiProperty({
    description: 'Preço atual de venda do produto.',
    example: 499.99,
    type: Number,
    minimum: 0,
  })
  @IsNumber({}, { message: 'O preço deve ser um número.' })
  @Min(0, { message: 'O preço não pode ser negativo.' })
  @IsNotEmpty({ message: 'O preço não pode ser vazio.' })
  price: number;

  @ApiProperty({
    description: 'Preço original do produto, se estiver com desconto (opcional).',
    example: 599.99,
    required: false,
    type: Number,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'O preço original deve ser um número.' })
  @Min(0, { message: 'O preço original não pode ser negativo.' })
  originalPrice?: number;
}
