import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
} from '@nestjs/common'
import { CreateUserDto, User } from 'shared'

import { ZodValidationPipe } from '../zod-validation-pipe'
import { UsersService } from './users.service'
import { createUserDtoStrictPhoneSchema } from './users.validation'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(): User[] {
    return this.usersService.getUsers()
  }

  @Get(':id')
  getUserById(@Param('id', ParseIntPipe) id: number): User {
    const user = this.usersService.getUserById(id)
    if (user) return user

    throw new NotFoundException()
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createUserDtoStrictPhoneSchema))
  createUser(@Body() user: CreateUserDto) {
    this.usersService.createUser(user)
  }
}
