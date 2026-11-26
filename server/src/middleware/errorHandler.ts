import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { env } from '../config/env'
import { AppError } from '../utils/AppError'

interface MongoDuplicateKeyError extends Error {
  code?: number
  keyValue?: Record<string, unknown>
}

/**
 * Catches requests to undefined routes and forwards a 404 AppError.
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

/**
 * Global Express error-handling middleware.
 * Normalizes operational, validation, and Mongoose errors into JSON responses.
 */
export const errorHandler: ErrorRequestHandler = (
  err,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500
  let message = 'Internal server error'
  let details: unknown

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    details = err.details
  } else if (err instanceof ZodError) {
    statusCode = 400
    message = 'Validation failed'
    details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    message = 'Database validation failed'
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = `Invalid value for ${err.path}`
  } else if (
    typeof err === 'object' &&
    err !== null &&
    (err as MongoDuplicateKeyError).code === 11000
  ) {
    statusCode = 409
    const duplicateFields = Object.keys(
      (err as MongoDuplicateKeyError).keyValue ?? {},
    )
    message =
      duplicateFields.length > 0
        ? `Duplicate value for: ${duplicateFields.join(', ')}`
        : 'Duplicate resource conflict'
  } else if (err instanceof Error && env.NODE_ENV !== 'production') {
    message = err.message
  }

  if (statusCode >= 500) {
    console.error('❌ Unhandled server error:', err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
    ...(env.NODE_ENV === 'development' && err instanceof Error
      ? { stack: err.stack }
      : {}),
  })
}
