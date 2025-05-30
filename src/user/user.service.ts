import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;

    try {
      // Criação do Usuário no banco de dados
      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: password,
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
    const dataForPrismaUpdate: Prisma.UserUpdateInput = {};

    if (updateUserDto.email) {
      dataForPrismaUpdate.email = updateUserDto.email;
    }
    if (updateUserDto.name) {
      dataForPrismaUpdate.name = updateUserDto.name;
    }
    if (updateUserDto.password) {
      if (updateUserDto.password.trim() === '') {
        throw new BadRequestException('A nova senha não pode ser uma string vazia.');
      } else {
        dataForPrismaUpdate.password = updateUserDto.password;
      }
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
    await this.findOne(id); // Reutiliza a lógica que lança NotFoundException

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
