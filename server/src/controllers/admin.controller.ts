import { Request, Response } from 'express'
import { AccountStatus, UserRole, VerificationStatus } from '../models'
import * as adminService from '../services/admin.service'
import {
  UpdateUserAccountStatusInput,
  UpdateVerificationStatusInput,
} from '../types/phase2.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, account_status, verification_status, q } = req.query as {
    role?: UserRole
    account_status?: AccountStatus
    verification_status?: VerificationStatus
    q?: string
  }

  const users = await adminService.listUsers({
    role,
    account_status,
    verification_status,
    q,
  })
  res.status(200).json({ success: true, data: { users } })
})

export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const user = await adminService.updateUserAccountStatus(
      req.params.userId,
      req.user.userId,
      req.body as UpdateUserAccountStatusInput,
    )
    res.status(200).json({
      success: true,
      message: 'User account status updated',
      data: { user },
    })
  },
)

export const updateUserVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await adminService.updateUserVerificationStatus(
      req.params.userId,
      req.body as UpdateVerificationStatusInput,
    )
    res.status(200).json({
      success: true,
      message: 'User verification status updated',
      data: { user },
    })
  },
)

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401)
  await adminService.deleteUserByAdmin(req.params.userId, req.user.userId)
  res.status(200).json({
    success: true,
    message: 'User account removed',
  })
})

export const getUserStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await adminService.getPlatformUserStats()
    res.status(200).json({ success: true, data: stats })
  },
)

export const getDashboardStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await adminService.getAdminDashboardStats()
    res.status(200).json({ success: true, data: stats })
  },
)
