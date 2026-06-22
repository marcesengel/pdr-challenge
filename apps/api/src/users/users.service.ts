import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { userSchema, type User } from 'shared';
import * as z from 'zod';

@Injectable()
export class UsersService {
  private users: User[] = [];

  async onModuleInit(): Promise<void> {
    const serializedUsers = await readFile(
      join(__dirname, 'assets/users.json'),
      'utf8',
    );
    const rawUsers = JSON.parse(serializedUsers);
    this.users = z.array(userSchema).parse(rawUsers);
  }

  getUsers(): User[] {
    return this.users;
  }
}
