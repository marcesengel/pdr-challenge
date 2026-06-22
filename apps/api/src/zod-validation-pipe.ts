import { BadRequestException, PipeTransform } from '@nestjs/common'
import { ZodType } from 'zod'

export class ZodValidationPipe<TType extends ZodType> implements PipeTransform {
  constructor(private schema: TType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value)

    if (result.success) {
      return result.data
    } else {
      throw new BadRequestException('Invalid request body')
    }
  }
}
