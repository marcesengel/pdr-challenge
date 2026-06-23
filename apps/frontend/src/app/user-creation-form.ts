import { Component, EventEmitter, Output, inject } from '@angular/core'
import {
  FormBuilder,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { provideNativeDateAdapter } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import type { CreateUserDto, User } from 'shared'

import { UsersService } from './users.service'

@Component({
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-user-creation-form',
  template: `
    <h2>Create user</h2>
    <form
      #formDirective="ngForm"
      [formGroup]="userForm"
      (ngSubmit)="createUser(formDirective)"
    >
      <div class="name-grid">
        <mat-form-field appearance="outline">
          <mat-label>First name</mat-label>
          <input
            matInput
            formControlName="firstName"
            autocomplete="given-name"
          />
          <mat-error>{{ getFieldError('firstName') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Last name</mat-label>
          <input
            matInput
            formControlName="lastName"
            autocomplete="family-name"
          />
          <mat-error>{{ getFieldError('lastName') }}</mat-error>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" autocomplete="email" />
        <mat-error>{{ getFieldError('email') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Phone</mat-label>
        <input matInput formControlName="phoneNumber" autocomplete="tel" />
        <mat-error>{{ getFieldError('phoneNumber') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Birth date</mat-label>
        <input
          matInput
          [matDatepicker]="birthDatePicker"
          formControlName="birthDate"
        />
        <mat-datepicker-toggle
          matIconSuffix
          [for]="birthDatePicker"
        ></mat-datepicker-toggle>
        <mat-datepicker #birthDatePicker></mat-datepicker>
        <mat-error>{{ getFieldError('birthDate') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select formControlName="role">
          @for (role of roles; track role) {
            <mat-option [value]="role">{{ role }}</mat-option>
          }
        </mat-select>
        <mat-error>{{ getFieldError('role') }}</mat-error>
      </mat-form-field>

      <button mat-flat-button type="submit" [disabled]="isCreating">
        {{ isCreating ? 'Creating...' : 'Create user' }}
      </button>
    </form>
  `,
  styles: `
    :host {
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      display: grid;
      gap: 18px;
      overflow: hidden;
      padding: 20px;
    }

    h2 {
      font: var(--mat-sys-title-large);
      margin: 0;
    }

    form {
      display: grid;
      gap: 12px;
    }

    .name-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    button[type='submit'] {
      justify-self: start;
      min-width: 128px;
    }

    @media (max-width: 1060px) {
      :host {
        max-width: 720px;
      }
    }

    @media (max-width: 720px) {
      .name-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class UserCreationForm {
  @Output() readonly userCreated = new EventEmitter<void>()

  private readonly formBuilder = inject(FormBuilder)
  private readonly snackBar = inject(MatSnackBar)
  private readonly usersService = inject(UsersService)

  protected readonly roles: User['role'][] = ['admin', 'editor', 'viewer']
  protected readonly userForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    birthDate: this.formBuilder.control<Date | null>(null, Validators.required),
    role: this.formBuilder.nonNullable.control<User['role']>('viewer', {
      validators: [Validators.required],
    }),
  })

  protected isCreating = false

  protected async createUser(formDirective: FormGroupDirective) {
    this.userForm.markAllAsTouched()
    this.clearZodErrors()

    const { createUserDtoSchema } = await import('shared')
    const result = createUserDtoSchema.safeParse(this.getCreateUserDto())
    if (!result.success) {
      this.applyZodErrors(result.error.issues)
      this.snackBar.open('Please fix the highlighted fields.', 'Dismiss', {
        duration: 3500,
      })
      return
    }

    this.isCreating = true
    this.usersService.createUser(result.data).subscribe({
      next: () => {
        formDirective.resetForm({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          birthDate: null,
          role: 'viewer',
        })
        this.snackBar.open('User created.', 'Dismiss', { duration: 3000 })
        this.userCreated.emit()
      },
      error: () => {
        this.snackBar.open('Unable to create user.', 'Dismiss', {
          duration: 4500,
        })
        this.isCreating = false
      },
      complete: () => {
        this.isCreating = false
      },
    })
  }

  protected getFieldError(field: keyof CreateUserDto) {
    const control = this.userForm.controls[field]
    if (!control.touched && !control.dirty) return ''
    if (control.hasError('required')) return 'Required'
    if (control.hasError('email')) return 'Enter a valid email'
    if (control.hasError('zod')) return control.getError('zod')
    return ''
  }

  private clearZodErrors() {
    Object.values(this.userForm.controls).forEach((control) => {
      const errors = control.errors
      if (!errors?.['zod']) return

      const remainingErrors = { ...errors }
      delete remainingErrors['zod']
      control.setErrors(
        Object.keys(remainingErrors).length ? remainingErrors : null,
      )
    })
  }

  private applyZodErrors(issues: { path: PropertyKey[]; message: string }[]) {
    issues.forEach((issue) => {
      const field = issue.path[0]
      if (typeof field !== 'string' || !(field in this.userForm.controls)) {
        return
      }

      const control = this.userForm.controls[field as keyof CreateUserDto]
      control.setErrors({ ...control.errors, zod: issue.message })
      control.markAsTouched()
    })
  }

  private getCreateUserDto(): CreateUserDto {
    const formValue = this.userForm.getRawValue()

    return {
      ...formValue,
      birthDate: formValue.birthDate ? this.formatDate(formValue.birthDate) : '',
    }
  }

  private formatDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }
}
