import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prisma/client';
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
      // Logar o erro real no servidor para depuração
      console.error(
        `[UserService - create] Error creating user with email ${email} in database:`,
        error,
      );
      throw new InternalServerErrorException(
        'Não foi possível criar o usuário devido a um erro interno. Por favor, tente novamente.',
      );
    }
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
