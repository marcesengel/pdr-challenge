import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'shared';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(): User[] {
    return this.usersService.getUsers();
  }
}
