import crypto from 'crypto'
import { env } from '../config/env'

/**
 * Generates a cryptographically random 6-digit numeric OTP.
 */
export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString()
}

/**
 * Computes a keyed HMAC-SHA256 hash of an OTP so plaintext codes are never stored.
 */
export const hashOtp = (otp: string): string => {
  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(otp)
    .digest('hex')
}

/**
 * Compares a plaintext OTP against a stored HMAC hash in constant time.
 */
export const verifyOtpHash = (otp: string, storedHash: string): boolean => {
  const computedHash = hashOtp(otp)
  const a = Buffer.from(computedHash, 'hex')
  const b = Buffer.from(storedHash, 'hex')

  if (a.length !== b.length) {
    return false
  }

  return crypto.timingSafeEqual(a, b)
}
