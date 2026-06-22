import { Injectable } from '@nestjs/common'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { type User, userSchema } from 'shared'

@Injectable()
export class UsersRepository {
  private users: Record<number, User> = {}
  private saveFilePath = join(process.cwd(), 'data/users.json')
  private currentMaxId = 1

  async onModuleInit(): Promise<void> {
    await this.loadUsers()
    await mkdir(dirname(this.saveFilePath), { recursive: true })
  }

  private async loadUsers() {
    const serializedUsers = await readFile(
      join(__dirname, 'assets/users.json'),
      'utf8',
    )
    const rawUsers = JSON.parse(serializedUsers)
    if (!Array.isArray(rawUsers))
      throw new Error('Expected raw users to be an array.')

    this.users = rawUsers
      .map((ru) => userSchema.safeParse(ru))
      .filter((r) => r.success)
      .map((r) => r.data)

    this.currentMaxId = Math.max(...Object.values(this.users).map((u) => u.id))
  }

  findMany(): User[] {
    return Object.values(this.users)
  }

  findById(id: number): User | undefined {
    return this.users[id]
  }

  create(user: CreateUserRecord) {
    const id = ++this.currentMaxId
    this.users[id] = {
      id,
      ...user,
    }
    this.queueWrite()
  }

  private isWriting = false
  private writeIsStale = false
  protected queueWrite() {
    if (this.isWriting) {
      this.writeIsStale = true
      return
    }

    void this.writeToDisk()
  }

  private async writeToDisk(): Promise<void> {
    this.isWriting = true

    try {
      do {
        // reset stale write detection as current value of this.users
        // will be written - if after stringify this.users is updated,
        // we'll have to go again
        this.writeIsStale = false
        const json = JSON.stringify(Object.values(this.users))

        try {
          await writeFile(this.saveFilePath, json, 'utf8')
        } catch (error) {
          console.error('Failed to write users to disk. Retrying.', error)
          this.writeIsStale = true
          await setTimeout(1000)
        }
      } while (this.writeIsStale)
    } finally {
      this.isWriting = false
    }
  }
}

export type CreateUserRecord = Omit<User, 'id'>
