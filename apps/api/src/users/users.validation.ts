import { PhoneNumberUtil } from 'google-libphonenumber'
import { createUserDtoSchema, userSchema } from 'shared'
import * as z from 'zod'

const defaultPhoneRegion = 'US'
const phoneUtil = PhoneNumberUtil.getInstance()

function isStrictPhoneNumber(phoneNumber: string) {
  try {
    const parsedPhoneNumber = phoneUtil.parse(phoneNumber, defaultPhoneRegion)

    return (
      phoneUtil.isPossibleNumber(parsedPhoneNumber) &&
      !parsedPhoneNumber.hasExtension()
    )
  } catch {
    return false
  }
}

function withStrictPhoneValidation<TSchema extends z.ZodType>(
  schema: TSchema,
) {
  return schema.superRefine((value, ctx) => {
    const phoneNumber =
      value &&
      typeof value === 'object' &&
      'phoneNumber' in value &&
      typeof value.phoneNumber === 'string'
        ? value.phoneNumber
        : undefined

    if (phoneNumber && !isStrictPhoneNumber(phoneNumber)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid phone number',
        path: ['phoneNumber'],
      })
    }
  })
}

export const createUserDtoStrictPhoneSchema =
  withStrictPhoneValidation(createUserDtoSchema)
export const userStrictPhoneSchema = withStrictPhoneValidation(userSchema)
