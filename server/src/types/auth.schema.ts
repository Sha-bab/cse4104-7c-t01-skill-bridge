import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password cannot exceed 72 characters')

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please provide a valid email address')

export const registerStudentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  institutional_id: z
    .string()
    .trim()
    .min(3, 'Student ID must be at least 3 characters')
    .max(50, 'Student ID cannot exceed 50 characters'),
  password: passwordSchema,
})

export const registerFacultySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  institutional_id: z
    .string()
    .trim()
    .min(3, 'Faculty ID must be at least 3 characters')
    .max(50, 'Faculty ID cannot exceed 50 characters')
    .optional(),
  password: passwordSchema,
})

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
})

export const resendOtpSchema = z.object({
  email: emailSchema,
})

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Email or institutional ID is required'),
  password: z.string().min(1, 'Password is required'),
})

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
})

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from the current password',
    path: ['new_password'],
  })

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>
export type RegisterFacultyInput = z.infer<typeof registerFacultySchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResendOtpInput = z.infer<typeof resendOtpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
