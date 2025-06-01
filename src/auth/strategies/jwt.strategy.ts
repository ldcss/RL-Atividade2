import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Para pegar o JWT_SECRET do .env
import { UserService } from '../../user/user.service'; // Para buscar o usuário completo se necessário

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // o que foi assinado no jwtService.sign()
  async validate(payload: { sub: string; email: string; name?: string }): Promise<any> {
    // o sub foi intencionalmente definida para armazenar o id do usuario no AuthService.login
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou token inválido.');
    }
    const { password, ...result } = user;
    return result; // retorna o objeto User sem a senha
  }
}
