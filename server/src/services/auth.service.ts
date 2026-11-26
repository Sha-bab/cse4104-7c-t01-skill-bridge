import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { env } from '../config/env'
import {
  IUserDocument,
  User,
  UserRole,
  Verification,
} from '../models'
import {
  ChangePasswordInput,
  LoginInput,
  RegisterFacultyInput,
  RegisterStudentInput,
  VerifyEmailInput,
} from '../types/auth.schema'
import { AppError } from '../utils/AppError'
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt'
import { generateOtp, hashOtp, verifyOtpHash } from '../utils/otp'
import { sendVerificationOtpEmail } from './email.service'

const SALT_ROUNDS = 12
const MAX_OTP_ATTEMPTS = 5

export interface SafeUserResponse {
  id: string
  name: string
  email: string
  institutional_id?: string
  role: UserRole
  is_email_verified: boolean
  verification_status: IUserDocument['verification_status']
  account_status: IUserDocument['account_status']
  created_at: Date
  updated_at: Date
}

export interface AuthTokensResponse {
  access_token: string
  refresh_token: string
  user: SafeUserResponse
}

const sanitizeUser = (user: IUserDocument): SafeUserResponse => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  ...(user.institutional_id ? { institutional_id: user.institutional_id } : {}),
  role: user.role,
  is_email_verified: user.is_email_verified,
  verification_status: user.verification_status,
  account_status: user.account_status,
  created_at: user.created_at,
  updated_at: user.updated_at,
})

const assertAccountActive = (user: IUserDocument): void => {
  if (user.account_status === 'active') {
    return
  }

  const reason = user.restriction_reason
    ? ` Reason: ${user.restriction_reason}`
    : ''

  throw new AppError(
    `Account is ${user.account_status}.${reason}`.trim(),
    403,
    {
      account_status: user.account_status,
      ...(user.restriction_reason
        ? { restriction_reason: user.restriction_reason }
        : {}),
    },
  )
}

const issueOtpForUser = async (user: IUserDocument): Promise<void> => {
  // Invalidate any previously unused email OTPs for this user
  await Verification.updateMany(
    {
      user_id: user._id,
      verification_type: 'email_otp',
      status: 'pending',
    },
    { $set: { status: 'expired' } },
  )

  const otp = generateOtp()
  const otpHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000)

  await Verification.create({
    user_id: user._id,
    verification_type: 'email_otp',
    otp_hash: otpHash,
    status: 'pending',
    expires_at: expiresAt,
    attempts: 0,
  })

  await sendVerificationOtpEmail({
    to: user.email,
    name: user.name,
    otp,
    expiresInMinutes: env.OTP_EXPIRES_MINUTES,
  })
}

const issueSessionTokens = async (
  user: IUserDocument,
): Promise<AuthTokensResponse> => {
  const userId = user._id.toString()
  const accessToken = signAccessToken(userId, user.role)
  const refreshToken = signRefreshToken(userId)

  user.refresh_token_hash = hashToken(refreshToken)
  await user.save()

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: sanitizeUser(user),
  }
}

const registerAccount = async (
  input: RegisterStudentInput | RegisterFacultyInput,
  role: 'student' | 'faculty',
): Promise<{ user: SafeUserResponse; message: string }> => {
  const existingEmail = await User.findOne({ email: input.email })
  if (existingEmail) {
    throw new AppError('An account with this email already exists', 409)
  }

  if (input.institutional_id) {
    const existingId = await User.findOne({
      institutional_id: input.institutional_id,
    })
    if (existingId) {
      throw new AppError(
        'An account with this institutional ID already exists',
        409,
      )
    }
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

  const user = await User.create({
    name: input.name,
    email: input.email,
    institutional_id: input.institutional_id,
    password_hash: passwordHash,
    role,
    is_email_verified: false,
    verification_status: 'pending',
    account_status: 'active',
  })

  await issueOtpForUser(user)

  return {
    user: sanitizeUser(user),
    message:
      'Registration successful. Please verify your email with the 6-digit OTP sent to your address.',
  }
}

export const registerStudent = (input: RegisterStudentInput) => {
  return registerAccount(input, 'student')
}

export const registerFaculty = (input: RegisterFacultyInput) => {
  return registerAccount(input, 'faculty')
}

export const verifyEmailOtp = async (
  input: VerifyEmailInput,
): Promise<AuthTokensResponse> => {
  const user = await User.findOne({ email: input.email })
  if (!user) {
    throw new AppError('Account not found', 404)
  }

  assertAccountActive(user)

  if (user.is_email_verified) {
    throw new AppError('Email is already verified', 400)
  }

  const verification = await Verification.findOne({
    user_id: user._id,
    verification_type: 'email_otp',
    status: 'pending',
  })
    .select('+otp_hash')
    .sort({ created_at: -1 })

  if (!verification) {
    throw new AppError(
      'No pending verification code found. Please request a new OTP.',
      400,
    )
  }

  if (verification.expires_at.getTime() < Date.now()) {
    verification.status = 'expired'
    await verification.save()
    throw new AppError(
      'Verification code has expired. Please request a new OTP.',
      400,
    )
  }

  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    verification.status = 'failed'
    await verification.save()
    throw new AppError(
      'Maximum verification attempts exceeded. Please request a new OTP.',
      429,
    )
  }

  const isMatch = verifyOtpHash(input.otp, verification.otp_hash)
  if (!isMatch) {
    verification.attempts += 1
    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      verification.status = 'failed'
    }
    await verification.save()
    throw new AppError('Invalid verification code', 400)
  }

  verification.status = 'verified'
  await verification.save()

  user.is_email_verified = true
  await user.save()

  return issueSessionTokens(user)
}

export const resendVerificationOtp = async (
  email: string,
): Promise<{ message: string }> => {
  const user = await User.findOne({ email })
  if (!user) {
    throw new AppError('Account not found', 404)
  }

  assertAccountActive(user)

  if (user.is_email_verified) {
    throw new AppError('Email is already verified', 400)
  }

  await issueOtpForUser(user)

  return {
    message: 'A new verification code has been sent to your email.',
  }
}

export const loginUser = async (
  input: LoginInput,
  panel: 'user' | 'admin' = 'user',
): Promise<AuthTokensResponse> => {
  const normalizedIdentifier = input.identifier.trim()
  const isEmailLookup = normalizedIdentifier.includes('@')

  const query = isEmailLookup
    ? { email: normalizedIdentifier.toLowerCase() }
    : {
        $or: [
          { institutional_id: normalizedIdentifier },
          { email: normalizedIdentifier.toLowerCase() },
        ],
      }

  const user = await User.findOne(query).select('+password_hash')
  if (!user) {
    throw new AppError('Invalid credentials', 401)
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.password_hash,
  )
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401)
  }

  assertAccountActive(user)

  if (!user.is_email_verified) {
    throw new AppError(
      'Email is not verified. Please verify your email OTP before logging in.',
      403,
    )
  }

  const isAdminPanelRole = user.role === 'admin' || user.role === 'moderator'
  if (panel === 'admin' && !isAdminPanelRole) {
    throw new AppError(
      'Access denied. This endpoint is restricted to administrators and moderators.',
      403,
    )
  }
  if (panel === 'user' && isAdminPanelRole) {
    throw new AppError(
      'Please sign in through the admin panel login endpoint.',
      403,
    )
  }

  return issueSessionTokens(user)
}

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<AuthTokensResponse> => {
  const payload = verifyRefreshToken(refreshToken)

  const user = await User.findById(payload.userId).select('+refresh_token_hash')
  if (!user || !user.refresh_token_hash) {
    throw new AppError('Invalid refresh token', 401)
  }

  assertAccountActive(user)

  const incomingHash = Buffer.from(hashToken(refreshToken), 'hex')
  const storedHash = Buffer.from(user.refresh_token_hash, 'hex')

  if (
    incomingHash.length !== storedHash.length ||
    !crypto.timingSafeEqual(incomingHash, storedHash)
  ) {
    throw new AppError('Refresh token has been revoked', 401)
  }

  return issueSessionTokens(user)
}

export const logoutUser = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refresh_token_hash: 1 },
  })
}

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
): Promise<{ message: string }> => {
  const user = await User.findById(userId).select('+password_hash')
  if (!user) {
    throw new AppError('Account not found', 404)
  }

  assertAccountActive(user)

  const isCurrentValid = await bcrypt.compare(
    input.current_password,
    user.password_hash,
  )
  if (!isCurrentValid) {
    throw new AppError('Current password is incorrect', 401)
  }

  user.password_hash = await bcrypt.hash(input.new_password, SALT_ROUNDS)
  user.refresh_token_hash = undefined
  await user.save()

  return {
    message: 'Password updated successfully. Please log in again.',
  }
}

export const getCurrentUser = async (
  userId: string,
): Promise<SafeUserResponse> => {
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('Account not found', 404)
  }

  assertAccountActive(user)
  return sanitizeUser(user)
}
