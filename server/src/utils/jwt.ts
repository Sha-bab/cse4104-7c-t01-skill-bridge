import crypto from 'crypto'
import jwt, { SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'
import { UserRole } from '../models/User.model'
import { AppError } from './AppError'

export interface AccessTokenPayload {
  userId: string
  role: UserRole
  type: 'access'
}

export interface RefreshTokenPayload {
  userId: string
  type: 'refresh'
}

export const signAccessToken = (userId: string, role: UserRole): string => {
  const payload: AccessTokenPayload = { userId, role, type: 'access' }
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  })
}

export const signRefreshToken = (userId: string): string => {
  const payload: RefreshTokenPayload = { userId, type: 'refresh' }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  })
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      decoded.type !== 'access' ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.role !== 'string'
    ) {
      throw new AppError('Invalid access token', 401)
    }
    return decoded as AccessTokenPayload
  } catch (err) {
    if (err instanceof AppError) {
      throw err
    }
    throw new AppError('Invalid or expired access token', 401)
  }
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET)
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      decoded.type !== 'refresh' ||
      typeof decoded.userId !== 'string'
    ) {
      throw new AppError('Invalid refresh token', 401)
    }
    return decoded as RefreshTokenPayload
  } catch (err) {
    if (err instanceof AppError) {
      throw err
    }
    throw new AppError('Invalid or expired refresh token', 401)
  }
}

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}
