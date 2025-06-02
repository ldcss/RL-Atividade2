import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import {
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUserPayload } from 'src/auth/type/authenticated-user.payload';
import { User } from '@prisma/client';
import { UserRole } from './type/UserRole';

@ApiTags('User Management')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar todos os usuários (Apenas para admin)' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado. Recurso para administradores.',
  })
  async findAll(@Req() req: Request & { user: AuthenticatedUserPayload }): Promise<UserEntity[]> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso.');
    }
    const users: UserEntity[] = await this.userService.findAll();
    return users;
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Busca o próprio perfil' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Perfil do usuário.', type: UserEntity })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async getMyProfile(
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<UserEntity> {
    const userFromDb: UserEntity = await this.userService.findOne(req.user.id);
    return userFromDb;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter um usuário pelo seu ID (apenas para ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID do Usuário (UUID)', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detalhes do usuário.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Acesso negado.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<UserEntity> {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Você não tem permissão para visualizar este perfil.');
    }
    const user: UserEntity = await this.userService.findOne(id);
    return user;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza um usuário pelo seu ID (apenas para ADMIN)' })
  @ApiParam({
    name: 'id',
    description: 'ID do Usuário (UUID) a ser atualizado',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Usuário atualizado.', type: UserEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email já em uso.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Acesso negado.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<UserEntity> {
    const loggedInUser = req.user;
    if (loggedInUser.role === UserRole.CUSTOMER) {
      if (loggedInUser.id !== id) {
        throw new ForbiddenException('Você só pode atualizar seu próprio perfil.');
      }
      if (updateUserDto.role !== undefined && updateUserDto.role !== UserRole.CUSTOMER) {
        // um CUSTOMER não pode se promover a ADMIN ou mudar sua role
        throw new ForbiddenException('Você não tem permissão para alterar seu papel.');
      }
      if (updateUserDto.role) {
        delete updateUserDto.role;
      }
    }
    const updatedUser: UserEntity = await this.userService.update(id, updateUserDto);
    return updatedUser;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar um usuário pelo seu ID (apenas para ADMIN)' })
  @ApiParam({
    name: 'id',
    description: 'ID do Usuário (UUID) a ser deletado',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Usuário deletado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado.' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Não é possível deletar (ex: pedidos associados).',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Acesso negado.' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<void> {
    const loggedInUser = req.user;

    // um customer pode deletar ele mesmo, o admin pode deletar outros.
    if (loggedInUser.role !== UserRole.ADMIN && loggedInUser.id !== id) {
      throw new ForbiddenException('Você não tem permissão para deletar este usuário.');
    }

    await this.userService.remove(id);
  }
}
