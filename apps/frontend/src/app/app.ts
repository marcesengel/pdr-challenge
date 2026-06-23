import { Component, ViewChild, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { finalize } from 'rxjs'
import type { User } from 'shared'

import { UserCreationForm } from './user-creation-form'
import { UserDetailsDialog } from './user-details-dialog'
import { UsersService } from './users.service'

@Component({
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTableModule,
    UserCreationForm,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly dialog = inject(MatDialog)
  private readonly snackBar = inject(MatSnackBar)
  private readonly usersService = inject(UsersService)

  protected readonly displayedColumns = ['id', 'name', 'email', 'role']
  protected readonly dataSource = new MatTableDataSource<User>([])

  protected isLoading = false
  protected searchTerm = ''

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator
  }

  constructor() {
    this.dataSource.filterPredicate = (user, filter) =>
      this.fullName(user).toLowerCase().includes(filter)
    this.loadUsers()
  }

  protected applySearch(value: string) {
    this.searchTerm = value
    this.dataSource.filter = value.trim().toLowerCase()
    this.dataSource.paginator?.firstPage()
  }

  protected openDetails(user: User) {
    this.dialog.open(UserDetailsDialog, {
      data: { userId: user.id },
      width: '520px',
    })
  }

  protected fullName(user: Pick<User, 'firstName' | 'lastName'>) {
    return `${user.firstName} ${user.lastName}`
  }

  protected detailsActionLabel(user: User) {
    return `View details for ${this.fullName(user)}`
  }

  protected loadUsers() {
    this.isLoading = true
    this.usersService
      .getUsers()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (users) => {
          this.dataSource.data = users
        },
        error: () => {
          this.snackBar.open('Unable to load users.', 'Dismiss', {
            duration: 4500,
          })
        },
      })
  }
}
