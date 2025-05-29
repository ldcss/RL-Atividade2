import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsDate, IsEmail, IsOptional, IsString } from 'class-validator';

export class UserEntity {
  @ApiProperty({
    description: 'O ID único do usuário (UUID)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'O endereço de email do usuário',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'O nome do usuário',
    example: 'Nome Sobrenome',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  name: string | null;

  @ApiProperty({
    description: 'Data de criação do usuário',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
  })
  @IsDate()
  updatedAt: Date;

  @Exclude()
  @IsString()
  password?: string;
}
