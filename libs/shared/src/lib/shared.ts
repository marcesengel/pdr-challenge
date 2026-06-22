import {
  PhoneNumberFormat,
  PhoneNumberUtil,
} from 'google-libphonenumber'
import * as z from 'zod'

const defaultPhoneRegion = 'US'
const phoneUtil = PhoneNumberUtil.getInstance()
const defaultPhoneCountryCode =
  phoneUtil.getCountryCodeForRegion(defaultPhoneRegion)

const phoneNumberSchema = z
  .string()
  .trim()
  .transform((phoneNumber, ctx) => {
    try {
      const parsedPhoneNumber = phoneUtil.parse(
        phoneNumber,
        defaultPhoneRegion,
      )
      const hasExpectedDefaultCountryCode =
        phoneNumber.startsWith('+') ||
        parsedPhoneNumber.getCountryCode() === defaultPhoneCountryCode

      if (
        !hasExpectedDefaultCountryCode ||
        !phoneUtil.isPossibleNumber(parsedPhoneNumber) ||
        parsedPhoneNumber.hasExtension()
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid phone number',
        })
        return z.NEVER
      }

      return phoneUtil.format(parsedPhoneNumber, PhoneNumberFormat.E164)
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid phone number',
      })
      return z.NEVER
    }
  })
  .pipe(z.e164())

export const userSchema = z.strictObject({
  id: z.number(),
  role: z.enum(['admin', 'editor', 'viewer']),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  phoneNumber: phoneNumberSchema,
  birthDate: z.iso.date(),
})

export type User = z.infer<typeof userSchema>

export const createUserDtoSchema = userSchema.omit({
  id: true,
})

export type CreateUserDto = z.infer<typeof createUserDtoSchema>
