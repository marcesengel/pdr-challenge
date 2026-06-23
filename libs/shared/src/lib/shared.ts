import * as z from 'zod'

const phoneNumberSchema = z
  .string()
  .trim()
  .transform((phoneNumber) => {
    const normalizedPhoneNumber = phoneNumber.replace(/[-.()\s]/g, '')

    return normalizedPhoneNumber.startsWith('+')
      ? normalizedPhoneNumber
      : `+1${normalizedPhoneNumber}`
  })
  .pipe(z.e164())

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const nonEmptyStringSchema = z.string().trim().min(1, 'Required')

export const userRoles = ['admin', 'editor', 'viewer'] as const
export type UserRole = (typeof userRoles)[number]
const baseUserSchema = z.strictObject({
  id: z.number(),
  role: z.enum(userRoles),
  firstName: nonEmptyStringSchema,
  lastName: nonEmptyStringSchema,
  email: z.email(),
  phoneNumber: z.preprocess(emptyStringToUndefined, phoneNumberSchema),
  birthDate: z.preprocess(emptyStringToUndefined, z.iso.date()),
})

export const optionalUserFieldsByRole = {
  admin: [],
  editor: ['birthDate'],
  viewer: ['phoneNumber', 'birthDate'],
} as const satisfies Record<
  UserRole,
  readonly (keyof z.infer<typeof baseUserSchema>)[]
>
export type ConditionalUserField =
  (typeof optionalUserFieldsByRole)[UserRole][number]

function fieldNamesToMask<T extends string>(fields: readonly T[]) {
  return Object.fromEntries(fields.map((field) => [field, true])) as {
    [K in T]: true
  }
}

const userSchemaForRole = <TRole extends UserRole>(role: TRole) => {
  return baseUserSchema.extend({
    role: z.literal(role),
  })
}

export const userSchema = z.discriminatedUnion('role', [
  userSchemaForRole('admin').partial(
    fieldNamesToMask(optionalUserFieldsByRole['admin']),
  ),
  userSchemaForRole('editor').partial(
    fieldNamesToMask(optionalUserFieldsByRole['editor']),
  ),
  userSchemaForRole('viewer').partial(
    fieldNamesToMask(optionalUserFieldsByRole['viewer']),
  ),
])

export const createUserDtoSchema = z.discriminatedUnion('role', [
  userSchemaForRole('admin')
    .omit({ id: true })
    .partial(fieldNamesToMask(optionalUserFieldsByRole['admin'])),
  userSchemaForRole('editor')
    .omit({ id: true })
    .partial(fieldNamesToMask(optionalUserFieldsByRole['editor'])),
  userSchemaForRole('viewer')
    .omit({ id: true })
    .partial(fieldNamesToMask(optionalUserFieldsByRole['viewer'])),
])

export type User = z.infer<typeof userSchema>
export type CreateUserDto = z.infer<typeof createUserDtoSchema>
export type CreateUserDtoField = keyof CreateUserDto

export const validationErrorResponseSchema = z.strictObject({
  message: z.string(),
  errors: z.array(
    z.strictObject({
      path: z.array(z.union([z.string(), z.number()])),
      message: z.string(),
    }),
  ),
})

export type ValidationErrorResponse = z.infer<
  typeof validationErrorResponseSchema
>
