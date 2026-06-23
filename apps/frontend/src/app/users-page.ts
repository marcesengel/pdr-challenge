import { Component, ViewChild, inject } from '@angular/core'
import { MatChipsModule } from '@angular/material/chips'
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
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTableModule,
    UserCreationForm,
  ],
  selector: 'app-users-page',
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <p>Directory</p>
          <h1>Users</h1>
        </div>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search full name</mat-label>
          <input
            #searchInput
            matInput
            type="search"
            [value]="searchTerm"
            (input)="applySearch(searchInput.value)"
          />
        </mat-form-field>
      </header>

      <section class="content-grid">
        <section class="list-panel" aria-label="User list">
          <div class="table-wrap">
            <table mat-table [dataSource]="dataSource">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let user">{{ user.id }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let user">{{ fullName(user) }}</td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let user">{{ user.email }}</td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip class="role-chip">{{ user.role }}</mat-chip>
                  <button
                    type="button"
                    class="row-action"
                    (click)="$event.stopPropagation(); openDetails(user)"
                  >
                    <span>{{ detailsActionLabel(user) }}</span>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let user; columns: displayedColumns"
                (click)="openDetails(user)"
              ></tr>

              <tr class="mat-row empty-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  {{ isLoading ? 'Loading users...' : 'No users found.' }}
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [pageSize]="25"
            [pageSizeOptions]="[25]"
            showFirstLastButtons
          ></mat-paginator>
        </section>

        <app-user-creation-form
          aria-label="Create user"
          (userCreated)="loadUsers()"
        />
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100%;
    }

    .page {
      display: grid;
      gap: 24px;
      padding: 32px;
    }

    .page-header {
      align-items: end;
      display: grid;
      gap: 16px;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
    }

    .page-header p,
    .page-header h1 {
      margin: 0;
    }

    .page-header p {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      font-weight: 700;
      text-transform: uppercase;
    }

    .page-header h1 {
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-display-small);
    }

    .search-field {
      width: 100%;
    }

    .content-grid {
      align-items: start;
      display: grid;
      gap: 24px;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
    }

    .list-panel {
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      overflow: hidden;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      min-width: 720px;
      overflow: clip;
      width: 100%;
    }

    th.mat-mdc-header-cell {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 700;
    }

    tr.mat-mdc-row {
      cursor: pointer;
    }

    tr.mat-mdc-row:focus-within,
    tr.mat-mdc-row:hover {
      background: var(--mat-sys-secondary-container);
    }

    td.mat-mdc-cell {
      overflow-wrap: anywhere;
    }

    td.mat-column-role {
      position: relative;
    }

    .row-action {
      appearance: none;
      background: transparent;
      border: 0;
      padding: 0;
      position: static;
    }

    .row-action:focus {
      outline: none;
    }

    .row-action span {
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }

    .empty-row td {
      color: var(--mat-sys-on-surface-variant);
      padding: 32px 24px;
      text-align: center;
    }

    .role-chip {
      pointer-events: none;
      text-transform: capitalize;
      --mat-chip-hover-state-layer-opacity: 0;
    }

    @media (max-width: 1060px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .page {
        padding: 20px;
      }

      .page-header {
        align-items: stretch;
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class UsersPage {
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
