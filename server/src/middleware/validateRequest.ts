import { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodTypeAny } from 'zod'
import { AppError } from '../utils/AppError'

interface RequestSchemas {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

/**
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 * Replaces validated request segments with parsed/sanitized values.
 */
export const validateRequest = (schemas: RequestSchemas): RequestHandler => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (schemas.body) {
        const result = await schemas.body.safeParseAsync(req.body)
        if (!result.success) {
          throw new AppError('Validation failed', 400, result.error.issues)
        }
        req.body = result.data
      }

      if (schemas.query) {
        const result = await schemas.query.safeParseAsync(req.query)
        if (!result.success) {
          throw new AppError('Invalid query parameters', 400, result.error.issues)
        }
        req.query = result.data
      }

      if (schemas.params) {
        const result = await schemas.params.safeParseAsync(req.params)
        if (!result.success) {
          throw new AppError('Invalid route parameters', 400, result.error.issues)
        }
        req.params = result.data
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
