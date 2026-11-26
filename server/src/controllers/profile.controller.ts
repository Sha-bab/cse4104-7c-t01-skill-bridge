import { Request, Response } from 'express'
import * as profileService from '../services/profile.service'
import {
  AddUserSkillInput,
  CreateProjectInput,
  UpdateFacultyProfileInput,
  UpdateProjectInput,
  UpdateStudentProfileInput,
} from '../types/phase2.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user.userId
}

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await profileService.getMyProfile(requireUserId(req))
  res.status(200).json({ success: true, data })
})

export const getPublicProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await profileService.getPublicProfile(req.params.userId)
    res.status(200).json({ success: true, data })
  },
)

export const updateStudentProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await profileService.updateStudentProfile(
      requireUserId(req),
      req.body as UpdateStudentProfileInput,
    )
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data,
    })
  },
)

export const updateFacultyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await profileService.updateFacultyProfile(
      requireUserId(req),
      req.body as UpdateFacultyProfileInput,
    )
    res.status(200).json({
      success: true,
      message: 'Faculty profile updated successfully',
      data,
    })
  },
)

export const addUserSkill = asyncHandler(async (req: Request, res: Response) => {
  const skill = await profileService.addUserSkill(
    requireUserId(req),
    req.body as AddUserSkillInput,
  )
  res.status(201).json({
    success: true,
    message: 'Skill saved to profile',
    data: { skill },
  })
})

export const removeUserSkill = asyncHandler(
  async (req: Request, res: Response) => {
    await profileService.removeUserSkill(
      requireUserId(req),
      req.params.userSkillId,
    )
    res.status(200).json({
      success: true,
      message: 'Skill removed from profile',
    })
  },
)

export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    const project = await profileService.createProject(
      requireUserId(req),
      req.body as CreateProjectInput,
    )
    res.status(201).json({
      success: true,
      message: 'Project added',
      data: { project },
    })
  },
)

export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    const project = await profileService.updateProject(
      requireUserId(req),
      req.params.projectId,
      req.body as UpdateProjectInput,
    )
    res.status(200).json({
      success: true,
      message: 'Project updated',
      data: { project },
    })
  },
)

export const deleteProject = asyncHandler(
  async (req: Request, res: Response) => {
    await profileService.deleteProject(requireUserId(req), req.params.projectId)
    res.status(200).json({
      success: true,
      message: 'Project deleted',
    })
  },
)

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q, role, skill_id, department_id } = req.query as {
    q?: string
    role?: 'student' | 'faculty'
    skill_id?: string
    department_id?: string
  }
  const users = await profileService.searchUsers({
    q,
    role,
    skill_id,
    department_id,
  })
  res.status(200).json({ success: true, data: { users } })
})

export const deleteMyAccount = asyncHandler(
  async (req: Request, res: Response) => {
    await profileService.deleteMyAccount(requireUserId(req))
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    })
  },
)
