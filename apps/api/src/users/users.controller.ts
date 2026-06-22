import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common'
import { CreateUserDto, User, createUserDtoSchema } from 'shared'

import { ZodValidationPipe } from '../zod-validation-pipe'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(): User[] {
    return this.usersService.getUsers()
  }

  @Get(':id')
  getUserById(@Param('id') id: number): User {
    const user = this.usersService.getUserById(id)
    if (user) return user

    throw new NotFoundException()
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createUserDtoSchema))
  createUser(@Body() user: CreateUserDto) {
    this.usersService.createUser(user)
  }
}
