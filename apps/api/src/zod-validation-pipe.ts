import { BadRequestException, PipeTransform } from '@nestjs/common'
import type { ValidationErrorResponse } from 'shared'
import { ZodType } from 'zod'

export class ZodValidationPipe<TType extends ZodType> implements PipeTransform {
  constructor(private schema: TType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value)

    if (result.success) {
      return result.data
    } else {
      const response: ValidationErrorResponse = {
        message: 'Invalid request body',
        errors: result.error.issues.map((issue) => ({
          path: issue.path.map((pathSegment) =>
            typeof pathSegment === 'symbol'
              ? pathSegment.toString()
              : pathSegment,
          ),
          message: issue.message,
        })),
      }

      throw new BadRequestException(response)
    }
  }
}
