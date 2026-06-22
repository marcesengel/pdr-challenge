import { Injectable } from '@nestjs/common'
import { User } from 'shared'

import { CreateUserRecord, UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getUsers(): User[] {
    return this.usersRepository.findMany()
  }

  getUserById(id: number): User | undefined {
    return this.usersRepository.findById(id)
  }

  createUser(user: CreateUserInput) {
    return this.usersRepository.create(user)
  }
}

export type CreateUserInput = CreateUserRecord
