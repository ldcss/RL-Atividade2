import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'ID do usuário que está favoritando (UUID).',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', // Exemplo de UUID
    type: String,
  })
  @IsString({ message: 'O ID do usuário deve ser uma string.' })
  @IsNotEmpty({ message: 'O ID do usuário não pode ser vazio.' })
  @IsUUID('4', { message: 'O ID do usuário deve ser um UUID v4 válido.' }) // Valida se é um UUID
  userId: string; //será obtido quando implementar autenticação. por enquanto, vamos deixar

  @ApiProperty({
    description: 'ID do produto a ser favoritado (UUID).',
    example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', // Exemplo de UUID
    type: String,
  })
  @IsString({ message: 'O ID do produto deve ser uma string.' })
  @IsNotEmpty({ message: 'O ID do produto não pode ser vazio.' })
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID v4 válido.' })
  productId: string;
}
