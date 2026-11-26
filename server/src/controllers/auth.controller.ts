import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import {
  ChangePasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterFacultyInput,
  RegisterStudentInput,
  ResendOtpInput,
  VerifyEmailInput,
} from '../types/auth.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

export const registerStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.registerStudent(
      req.body as RegisterStudentInput,
    )
    res.status(201).json({
      success: true,
      message: result.message,
      data: { user: result.user },
    })
  },
)

export const registerFaculty = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.registerFaculty(
      req.body as RegisterFacultyInput,
    )
    res.status(201).json({
      success: true,
      message: result.message,
      data: { user: result.user },
    })
  },
)

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyEmailOtp(req.body as VerifyEmailInput)
  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: result,
  })
})

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ResendOtpInput
  const result = await authService.resendVerificationOtp(email)
  res.status(200).json({
    success: true,
    message: result.message,
  })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body as LoginInput, 'user')
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  })
})

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body as LoginInput, 'admin')
  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    data: result,
  })
})

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refresh_token } = req.body as RefreshTokenInput
    const result = await authService.refreshAccessToken(refresh_token)
    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: result,
    })
  },
)

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401)
  }
  await authService.logoutUser(req.user.userId)
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401)
    }
    const result = await authService.changePassword(
      req.user.userId,
      req.body as ChangePasswordInput,
    )
    res.status(200).json({
      success: true,
      message: result.message,
    })
  },
)

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401)
  }
  const user = await authService.getCurrentUser(req.user.userId)
  res.status(200).json({
    success: true,
    data: { user },
  })
})
