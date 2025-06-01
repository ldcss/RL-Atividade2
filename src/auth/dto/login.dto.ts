import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class Login {
  @ApiProperty({
    description: 'Email do usuário para login',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Formato de email inválido.' })
  @IsNotEmpty({ message: 'O email não pode ser vazio.' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário para login',
    example: 'senha123',
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha não pode ser vazia.' })
  password: string;
}
