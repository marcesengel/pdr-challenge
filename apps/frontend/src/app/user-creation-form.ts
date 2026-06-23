import { HttpErrorResponse } from '@angular/common/http'
import {
  Component,
  DestroyRef,
  EventEmitter,
  Output,
  inject,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
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
import { finalize } from 'rxjs'
import {
  type ConditionalUserField,
  type CreateUserDtoField,
  type UserRole,
  createUserDtoSchema,
  optionalUserFieldsByRole,
  userRoles,
  validationErrorResponseSchema,
} from 'shared'

import { UsersService } from './users.service'

type UserCreationField = Exclude<CreateUserDtoField, 'role'>
type UserCreationFormField = CreateUserDtoField

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
      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select formControlName="role">
          @for (role of roles; track role) {
            <mat-option [value]="role">{{ role }}</mat-option>
          }
        </mat-select>
        <mat-error>{{ getFieldError('role') }}</mat-error>
      </mat-form-field>

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
        <input
          matInput
          formControlName="phoneNumber"
          autocomplete="tel"
          [required]="isFieldRequired('phoneNumber')"
        />
        <mat-error>{{ getFieldError('phoneNumber') }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Birth date</mat-label>
        <input
          matInput
          [matDatepicker]="birthDatePicker"
          formControlName="birthDate"
          [required]="isFieldRequired('birthDate')"
        />
        <mat-datepicker-toggle
          matIconSuffix
          [for]="birthDatePicker"
        ></mat-datepicker-toggle>
        <mat-datepicker #birthDatePicker></mat-datepicker>
        <mat-error>{{ getFieldError('birthDate') }}</mat-error>
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

  private readonly destroyRef = inject(DestroyRef)
  private readonly formBuilder = inject(FormBuilder)
  private readonly snackBar = inject(MatSnackBar)
  private readonly usersService = inject(UsersService)
  private validationRequest = 0

  protected readonly roles = userRoles
  protected readonly userForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    birthDate: this.formBuilder.control<Date | null>(null),
    role: this.formBuilder.nonNullable.control<UserRole>('viewer', {
      validators: [Validators.required],
    }),
  })

  protected isCreating = false

  constructor() {
    void this.validateWithSharedSchema()
    this.userForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.validateWithSharedSchema())
  }

  protected createUser(formDirective: FormGroupDirective) {
    this.userForm.markAllAsTouched()
    const result = this.validateWithSharedSchema({
      markZodErrorsAsTouched: true,
    })

    if (!result.success) {
      this.snackBar.open('Please fix the highlighted fields.', 'Dismiss', {
        duration: 3500,
      })
      return
    }

    this.isCreating = true
    this.usersService
      .createUser(result.data)
      .pipe(
        finalize(() => {
          this.isCreating = false
        }),
      )
      .subscribe({
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
        error: (error: unknown) => {
          if (this.applyServerValidationErrors(error)) {
            this.snackBar.open(
              'Please fix the highlighted fields.',
              'Dismiss',
              {
                duration: 3500,
              },
            )
          } else {
            this.snackBar.open('Unable to create user.', 'Dismiss', {
              duration: 4500,
            })
          }
        },
      })
  }

  protected isFieldRequired(field: UserCreationField) {
    const optionalFields =
      optionalUserFieldsByRole[this.userForm.controls.role.value]

    return !(optionalFields as readonly string[]).includes(field)
  }

  protected getFieldError(field: UserCreationFormField) {
    const control = this.userForm.controls[field]
    if (!control.touched && !control.dirty) return ''
    if (control.hasError('required')) return 'Required'
    if (control.hasError('email')) return 'Enter a valid email'
    if (control.hasError('zod')) return control.getError('zod')
    return ''
  }

  private validateWithSharedSchema(options?: {
    markZodErrorsAsTouched?: boolean
  }) {
    this.syncRequiredValidators()
    this.clearZodErrors()

    const validationRequest = ++this.validationRequest
    const result = createUserDtoSchema.safeParse(this.getCreateUserDto())

    if (validationRequest !== this.validationRequest) {
      return result
    }

    if (!result.success) {
      this.applyZodErrors(
        result.error.issues,
        options?.markZodErrorsAsTouched ?? false,
      )
    }

    return result
  }

  private syncRequiredValidators() {
    this.syncRequiredValidator('phoneNumber')
    this.syncRequiredValidator('birthDate')
  }

  private syncRequiredValidator(field: ConditionalUserField) {
    const control = this.userForm.controls[field]
    control.setValidators(
      this.isFieldRequired(field) ? [Validators.required] : [],
    )
    control.updateValueAndValidity({ emitEvent: false })
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

  private applyZodErrors(
    issues: { path: PropertyKey[]; message: string }[],
    markAsTouched = false,
  ) {
    issues.forEach((issue) => {
      const field = issue.path[0]
      if (typeof field !== 'string' || !(field in this.userForm.controls)) {
        return
      }

      const control = this.userForm.controls[field as UserCreationFormField]
      control.setErrors({ ...control.errors, zod: issue.message })
      if (markAsTouched) control.markAsTouched()
    })
  }

  private applyServerValidationErrors(error: unknown) {
    if (!(error instanceof HttpErrorResponse)) {
      return false
    }

    const result = validationErrorResponseSchema.safeParse(error.error)

    if (!result.success) {
      return false
    }

    this.applyZodErrors(result.data.errors, true)
    return true
  }

  private getCreateUserDto(): unknown {
    const formValue = this.userForm.getRawValue()
    const user: Record<string, unknown> = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role,
    }

    const phoneNumber = formValue.phoneNumber.trim()
    if (phoneNumber) {
      user['phoneNumber'] = phoneNumber
    }

    if (formValue.birthDate) {
      user['birthDate'] = this.formatDate(formValue.birthDate)
    }

    return user
  }

  private formatDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }
}
