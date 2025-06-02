// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '@prisma/client';
import { Login } from './dto/login.dto';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login bem-sucedido, retorna token de acesso.',
  })
  @ApiOperation({ summary: 'Loga o usuário' })
  @ApiBody({ type: Login })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Credenciais inválidas.' })
  async login(@Req() req: Request & { user: Omit<User, 'password'> }) {
    return this.authService.login(req.user); // Retorna { access_token: '...' }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email já existe.' })
  async register(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    const newUser = await this.userService.create(createUserDto);
    return newUser;
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt')) // protege esta rota com a JwtStrategy
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obter o perfil do usuário logado' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Perfil do usuário.', type: UserEntity })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async getProfile(
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<AuthenticatedUser | UserEntity> {
    const userFromDb = await this.userService.findOne(req.user.id);
    if (!userFromDb) throw new UnauthorizedException();
    return userFromDb;
  }
}
