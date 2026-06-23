import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, from, map, switchMap } from 'rxjs'
import type { CreateUserDto } from 'shared'
import type { ZodType } from 'zod'

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient)
  private readonly usersUrl = '/api/users'

  getUsers() {
    return this.validateResponse(
      this.http.get<unknown>(this.usersUrl),
      async () => {
        const { userSchema } = await import('shared')
        return userSchema.array()
      },
    )
  }

  getUser(id: number) {
    return this.validateResponse(
      this.http.get<unknown>(`${this.usersUrl}/${id}`),
      async () => {
        const { userSchema } = await import('shared')
        return userSchema
      },
    )
  }

  createUser(user: CreateUserDto) {
    return this.http.post<void>(this.usersUrl, user)
  }

  private validateResponse<T>(
    response$: Observable<unknown>,
    loadSchema: () => Promise<ZodType<T>>,
  ) {
    return response$.pipe(
      switchMap((response) =>
        from(loadSchema()).pipe(map((schema) => schema.parse(response))),
      ),
    )
  }
}
