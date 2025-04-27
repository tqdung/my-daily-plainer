import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { transformResponse } from 'src/common/utils';
import { RequireAuth } from 'src/common/decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const createdUser = await this.usersService.create(createUserDto);
    return transformResponse(UserResponseDto, createdUser);
  }

  @Get()
  @RequireAuth()
  async findAll() {
    const users = await this.usersService.findAll();
    return transformResponse(UserResponseDto, users);
  }

  @Get(':id')
  @RequireAuth()
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    if (!user) throw new NotFoundException();

    return transformResponse(UserResponseDto, user);
  }

  @Patch(':id')
  @RequireAuth()
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return transformResponse(UserResponseDto, updatedUser);
  }

  @Delete(':id')
  @RequireAuth()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
