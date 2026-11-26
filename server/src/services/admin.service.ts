import {
  AccountStatus,
  Report,
  Resource,
  Session,
  User,
  UserRole,
  VerificationStatus,
} from '../models'
import {
  UpdateUserAccountStatusInput,
  UpdateVerificationStatusInput,
} from '../types/phase2.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

export const listUsers = async (filters: {
  role?: UserRole
  account_status?: AccountStatus
  verification_status?: VerificationStatus
  q?: string
}) => {
  const query: Record<string, unknown> = {}
  if (filters.role) query.role = filters.role
  if (filters.account_status) query.account_status = filters.account_status
  if (filters.verification_status) {
    query.verification_status = filters.verification_status
  }
  if (filters.q && filters.q.trim()) {
    const regex = new RegExp(filters.q.trim(), 'i')
    query.$or = [
      { name: regex },
      { email: regex },
      { institutional_id: regex },
    ]
  }

  return User.find(query)
    .select('-refresh_token_hash -password_hash')
    .sort({ created_at: -1 })
    .limit(100)
}

export const updateUserAccountStatus = async (
  targetUserId: string,
  adminUserId: string,
  input: UpdateUserAccountStatusInput,
) => {
  if (targetUserId === adminUserId && input.account_status !== 'active') {
    throw new AppError('Administrators cannot restrict their own account', 400)
  }

  const updateData: Record<string, unknown> = {
    account_status: input.account_status,
  }

  if (input.account_status === 'active') {
    updateData.restriction_reason = undefined
  } else if (input.restriction_reason) {
    updateData.restriction_reason = input.restriction_reason
  }

  const user = await User.findByIdAndUpdate(
    toObjectId(targetUserId, 'userId'),
    {
      $set: updateData,
      ...(input.account_status !== 'active'
        ? { $unset: { refresh_token_hash: 1 } }
        : {}),
    },
    { new: true, runValidators: true },
  )

  if (!user) {
    throw new AppError('User not found', 404)
  }

  return user
}

export const updateUserVerificationStatus = async (
  targetUserId: string,
  input: UpdateVerificationStatusInput,
) => {
  const user = await User.findByIdAndUpdate(
    toObjectId(targetUserId, 'userId'),
    { $set: { verification_status: input.verification_status } },
    { new: true, runValidators: true },
  )

  if (!user) {
    throw new AppError('User not found', 404)
  }

  return user
}

export const deleteUserByAdmin = async (
  targetUserId: string,
  adminUserId: string,
) => {
  if (targetUserId === adminUserId) {
    throw new AppError('Administrators cannot delete their own account here', 400)
  }

  const user = await User.findByIdAndUpdate(
    toObjectId(targetUserId, 'userId'),
    {
      $set: { account_status: 'deleted' },
      $unset: { refresh_token_hash: 1 },
    },
    { new: true },
  )

  if (!user) {
    throw new AppError('User not found', 404)
  }

  return user
}

export const getPlatformUserStats = async () => {
  const [totalUsers, students, faculty, pendingVerification, restrictedUsers] =
    await Promise.all([
      User.countDocuments({ account_status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'student', account_status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'faculty', account_status: { $ne: 'deleted' } }),
      User.countDocuments({
        verification_status: 'pending',
        account_status: { $ne: 'deleted' },
      }),
      User.countDocuments({
        account_status: { $in: ['restricted', 'suspended', 'blocked'] },
      }),
    ])

  return {
    total_users: totalUsers,
    students,
    faculty,
    pending_verification: pendingVerification,
    restricted_users: restrictedUsers,
  }
}

export const getAdminDashboardStats = async () => {
  const [
    userStats,
    pendingResources,
    approvedResources,
    pendingReports,
    activeSessions,
  ] = await Promise.all([
    getPlatformUserStats(),
    Resource.countDocuments({ approval_status: 'pending' }),
    Resource.countDocuments({ approval_status: 'approved' }),
    Report.countDocuments({ status: 'pending' }),
    Session.countDocuments({ status: 'scheduled' }),
  ])

  return {
    ...userStats,
    pending_resources: pendingResources,
    approved_resources: approvedResources,
    pending_reports: pendingReports,
    active_sessions: activeSessions,
  }
}
