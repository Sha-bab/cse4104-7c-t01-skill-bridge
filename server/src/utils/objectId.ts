import { Types } from 'mongoose'
import { z } from 'zod'
import { AppError } from './AppError'

export const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => Types.ObjectId.isValid(val), 'Invalid MongoDB ObjectId')

export const toObjectId = (id: string, fieldName = 'id'): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400)
  }
  return new Types.ObjectId(id)
}
