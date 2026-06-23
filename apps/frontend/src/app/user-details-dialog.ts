import { DatePipe } from '@angular/common'
import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { MatButtonModule } from '@angular/material/button'
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { catchError, of } from 'rxjs'
import type { User } from 'shared'

import { UsersService } from './users.service'

@Component({
  imports: [
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-user-details-dialog',
  template: `
    <h2 mat-dialog-title>User details</h2>

    <mat-dialog-content>
      @let user = userState();
      @if (user === undefined) {
        <div class="loading-state">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else if (user) {
        <section class="details">
          <div>
            <span>Full name</span>
            <strong>{{ fullName(user) }}</strong>
          </div>
          <mat-divider></mat-divider>
          <div>
            <span>Email</span>
            <strong>{{ user.email }}</strong>
          </div>
          <mat-divider></mat-divider>
          <div>
            <span>Phone</span>
            <strong>{{ user.phoneNumber }}</strong>
          </div>
          <mat-divider></mat-divider>
          <div>
            <span>Birth date</span>
            <strong>{{ user.birthDate | date: 'mediumDate' }}</strong>
          </div>
          <mat-divider></mat-divider>
          <div>
            <span>Role</span>
            <strong>{{ user.role }}</strong>
          </div>
        </section>
      } @else {
        <p class="error-state">{{ errorMessage }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    :host {
      display: block;
      min-width: min(420px, calc(100vw - 48px));
    }

    .loading-state {
      display: grid;
      min-height: 180px;
      place-items: center;
    }

    .details {
      display: grid;
      gap: 14px;
      padding-top: 4px;
    }

    .details div {
      display: grid;
      gap: 4px;
    }

    .details span {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    .details strong {
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-body-large);
      font-weight: 500;
      overflow-wrap: anywhere;
      text-transform: capitalize;
    }

    .details div:nth-child(3) strong,
    .details div:nth-child(5) strong {
      text-transform: none;
    }

    .error-state {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class UserDetailsDialog {
  private readonly data = inject<{ userId: number }>(MAT_DIALOG_DATA)
  private readonly dialogRef = inject(MatDialogRef<UserDetailsDialog>)
  private readonly usersService = inject(UsersService)

  protected readonly errorMessage = 'Unable to load user details.'
  protected readonly userState = toSignal(
    this.usersService.getUser(this.data.userId).pipe(
      catchError((err) => {
        console.error(err)
        return of(null)
      }),
    ),
    { initialValue: undefined },
  )

  protected close() {
    this.dialogRef.close()
  }

  protected fullName(user: User) {
    return `${user.firstName} ${user.lastName}`
  }
}
