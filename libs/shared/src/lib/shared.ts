import * as z from 'zod'

export const userRoles = ['admin', 'editor', 'viewer'] as const
export type UserRole = (typeof userRoles)[number]

export const userFieldNames = [
  'id',
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'birthDate',
] as const
export type BaseUserField = (typeof userFieldNames)[number]

export const requiredUserFieldsByRole = {
  admin: ['phoneNumber', 'birthDate'],
  editor: ['phoneNumber'],
  viewer: [],
} as const satisfies Record<UserRole, readonly BaseUserField[]>

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

const optionalStringInput = <TSchema extends z.ZodType>(schema: TSchema) =>
  z.preprocess(emptyStringToUndefined, schema.optional())

const nonEmptyStringSchema = z.string().trim().min(1, 'Required')

const userFieldSchemas = {
  id: z.number(),
  firstName: nonEmptyStringSchema,
  lastName: nonEmptyStringSchema,
  email: z.string().trim().pipe(z.email()),
  phoneNumber: optionalStringInput(phoneNumberSchema),
  birthDate: optionalStringInput(z.iso.date()),
} satisfies Record<BaseUserField, z.ZodType>

const conditionalUserFields = {
  phoneNumber: true,
  birthDate: true,
} satisfies Partial<Record<BaseUserField, true>>

const baseUserSchema = z.strictObject(userFieldSchemas).partial(
  conditionalUserFields,
)

function requiredFieldMask(fields: readonly BaseUserField[]) {
  return Object.fromEntries(fields.map((field) => [field, true])) as Partial<
    Record<BaseUserField, true>
  >
}

const userSchemaForRole = <TRole extends UserRole>(role: TRole) =>
  baseUserSchema
    .extend({
      role: z.literal(role),
    })
    .required(requiredFieldMask(requiredUserFieldsByRole[role]))

export const userSchema = z.discriminatedUnion('role', [
  userSchemaForRole('admin'),
  userSchemaForRole('editor'),
  userSchemaForRole('viewer'),
])

const createUserDtoSchemaForRole = <TRole extends UserRole>(role: TRole) =>
  userSchemaForRole(role).omit({
    id: true,
  })

export const createUserDtoSchema = z.discriminatedUnion('role', [
  createUserDtoSchemaForRole('admin'),
  createUserDtoSchemaForRole('editor'),
  createUserDtoSchemaForRole('viewer'),
])

export const validationErrorResponseSchema = z.strictObject({
  message: z.string(),
  errors: z.array(
    z.strictObject({
      path: z.array(z.union([z.string(), z.number()])),
      message: z.string(),
    }),
  ),
})

export type User = z.infer<typeof userSchema>
export type CreateUserDto = z.infer<typeof createUserDtoSchema>
export type ValidationErrorResponse = z.infer<
  typeof validationErrorResponseSchema
>
