import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateUserDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    const newUserFromDb: UserEntity = await this.userService.create(createUserDto);
    return newUserFromDb;
  }

  @Get()
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(): Promise<UserEntity[]> {
    const users: UserEntity[] = await this.userService.findAll();
    return users;
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserEntity> {
    const user: UserEntity = await this.userService.findOne(id);
    return user;
  }

  @Patch(':id')
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: HttpStatus.OK })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const updatedUser: UserEntity = await this.userService.update(id, updateUserDto);
    return updatedUser;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
