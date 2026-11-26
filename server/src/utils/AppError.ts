/**
 * Custom operational error class used across controllers, services, and middleware
 * to return consistent HTTP status codes and safe error messages.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode = 500,
    details?: unknown,
    isOperational = true,
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details

    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}
