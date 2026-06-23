import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, map } from 'rxjs'
import { type CreateUserDto, userSchema } from 'shared'
import type * as z from 'zod'

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient)
  private readonly usersUrl = '/api/users'

  getUsers() {
    return this.validateResponse(
      this.http.get<unknown>(this.usersUrl),
      userSchema.array(),
    )
  }

  getUser(id: number) {
    return this.validateResponse(
      this.http.get<unknown>(`${this.usersUrl}/${id}`),
      userSchema,
    )
  }

  createUser(user: CreateUserDto) {
    return this.http.post<void>(this.usersUrl, user)
  }

  private validateResponse<T>(
    response$: Observable<unknown>,
    schema: z.ZodType<T>,
  ) {
    return response$.pipe(map((response) => schema.parse(response)))
  }
}
