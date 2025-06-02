import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly saltRounds: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const saltFromEnv = parseInt(this.configService.get<string>('SALT_ROUNDS', '10'), 10);
    this.saltRounds = isNaN(saltFromEnv) ? 10 : saltFromEnv;

    if (isNaN(saltFromEnv)) {
      console.warn(
        `SALT_ROUNDS não é um número válido no .env ou não foi definido. Usando valor padrão: 10.`,
      );
    }
  }
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;

    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error(`Error hashing password for email ${email}:`, error);
      throw new InternalServerErrorException('Erro ao processar a senha.');
    }

    try {
      // criação do Usuário no banco de dados
      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });
      return newUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // violação de constraint única (ex: email @unique já existe)
        if (error.code === 'P2002') {
          throw new ConflictException(`O email '${email}' já está cadastrado.`);
        }
      }
      console.error(`Error creating user with email ${email} in database:`, error);
      throw new InternalServerErrorException(
        'Não foi possível criar o usuário devido a um erro interno. Por favor, tente novamente.',
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      return user; // retorna o usuário ou null se não encontrado
    } catch (error) {
      console.error(`Error fetching user by email ${email}:`, error);
      throw new InternalServerErrorException('Erro ao buscar usuário por email.');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw new InternalServerErrorException('Erro ao buscar usuários.');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`Usuário com ID '${id}' não encontrado.`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching user with ID ${id}:`, error);
      throw new InternalServerErrorException('Erro ao buscar o usuário.');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    const dataForPrismaUpdate: Prisma.UserUpdateInput = {};

    if (updateUserDto.email) {
      dataForPrismaUpdate.email = updateUserDto.email;
    }
    if (updateUserDto.name) {
      dataForPrismaUpdate.name = updateUserDto.name;
    }
    if (updateUserDto.password) {
      if (updateUserDto.password.trim() === '') {
        throw new BadRequestException('A nova senha não pode ser uma string vazia se fornecida.');
      }
      if (updateUserDto.password.length < 8) {
        throw new BadRequestException('A nova senha deve ter pelo menos 8 caracteres.');
      }
      try {
        dataForPrismaUpdate.password = await bcrypt.hash(updateUserDto.password, this.saltRounds);
      } catch (error) {
        console.error(`Error hashing password for user ID ${id}:`, error);
        throw new InternalServerErrorException('Erro ao processar a atualização da senha.');
      }
    }

    if (updateUserDto.role !== undefined) {
      dataForPrismaUpdate.role = updateUserDto.role;
    }

    if (Object.keys(dataForPrismaUpdate).length === 0) {
      return this.findOne(id);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: dataForPrismaUpdate,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Usuário com ID '${id}' não encontrado para atualização.`);
        }
        if (error.code === 'P2002' && dataForPrismaUpdate.email) {
          throw new ConflictException(
            `O email '${dataForPrismaUpdate.email}' já está em uso por outro usuário.`,
          );
        }
      }
      console.error(`Error updating user with ID ${id}:`, error);
      throw new InternalServerErrorException('Erro ao atualizar o usuário.');
    }
  }

  async remove(id: string): Promise<User> {
    await this.findOne(id);

    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        console.error(`Foreign key constraint failed for user ID ${id}:`, error.meta?.field_name);
        throw new ConflictException(
          `Não é possível deletar o usuário com ID '${id}' pois ele possui dados relacionados (ex: pedidos) que impedem a exclusão.`,
        );
      }
      console.error(`Error deleting user with ID ${id}:`, error);
      throw new InternalServerErrorException('Erro ao deletar o usuário.');
    }
  }
}
