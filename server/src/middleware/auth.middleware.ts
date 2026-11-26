import { NextFunction, Request, RequestHandler, Response } from 'express'
import { User, UserRole } from '../models/User.model'
import { AppError } from '../utils/AppError'
import { verifyAccessToken } from '../utils/jwt'

/**
 * Verifies the Bearer JWT access token and ensures the account is still active.
 * Attaches authenticated user metadata to req.user.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required', 401)
    }

    const token = authHeader.slice('Bearer '.length).trim()
    if (!token) {
      throw new AppError('Authentication token is required', 401)
    }

    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.userId)
    if (!user) {
      throw new AppError('User account no longer exists', 401)
    }

    if (user.account_status !== 'active') {
      const reason = user.restriction_reason
        ? ` Reason: ${user.restriction_reason}`
        : ''
      throw new AppError(
        `Account is ${user.account_status}.${reason}`.trim(),
        403,
      )
    }

    if (!user.is_email_verified) {
      throw new AppError('Email verification is required', 403)
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      verificationStatus: user.verification_status,
      accountStatus: user.account_status,
    }

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Role-based access control (RBAC) middleware.
 * Must be placed after `authenticate`.
 */
export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401))
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          'You do not have permission to perform this action',
          403,
        ),
      )
      return
    }

    next()
  }
}
