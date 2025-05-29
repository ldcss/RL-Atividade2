import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNotEmpty,
  MaxLength, // Adicionado para exemplo
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Endereço de email único do usuário.',
    example: 'usuario@exemplo.com',
    type: String,
    maxLength: 255,
  })
  @IsEmail({}, { message: 'O email fornecido deve ser um endereço válido.' })
  @IsNotEmpty({ message: 'O campo email não pode ser vazio.' })
  @MaxLength(255, { message: 'O email não pode exceder 255 caracteres.' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário. Deve ter no mínimo 8 caracteres.',
    example: 'S3nh@F0rt3!',
    type: String,
    minLength: 8,
    maxLength: 20,
  })
  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @IsNotEmpty({ message: 'O campo senha não pode ser vazio.' })
  password: string;

  @ApiProperty({
    description: 'Nome do usuário (opcional).',
    example: 'Fulano de Tal',
    required: false,
    type: String,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string.' })
  @MaxLength(255, { message: 'O nome não pode exceder 255 caracteres.' })
  name?: string;
}
