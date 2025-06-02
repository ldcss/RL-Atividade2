import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { UserService } from '../user/user.service'; // Para buscar usuários
import { JwtService } from '@nestjs/jwt'; // Para criar tokens JWT
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client'; // Tipo do Prisma

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findByEmail(email);

    if (user) {
      const isPasswordMatching = await bcrypt.compare(pass, user.password);
      if (isPasswordMatching) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null; // usuario nao encontrado ou senha incorreta
  }

  /*
   gera um token JWT para o usuário autenticado.
   Chamado pelo AuthController após a LocalStrategy validar o usuário.
   */
  async login(user: Omit<User, 'password'>) {
    const payload = {
      email: user.email,
      sub: user.id,
      name: user.name,
      role: user.role,
    };
    try {
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      console.error('Error signing JWT:', error);
      throw new InternalServerErrorException('Erro ao gerar token de autenticação.');
    }
  }
}
