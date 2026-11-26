import { Request, Response } from 'express'
import * as moderationService from '../services/moderation.service'
import {
  CreateReportInput,
  ModerationActionInput,
} from '../types/phase6.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user.userId
}

export const submitReport = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await moderationService.createReport(
      requireUserId(req),
      req.body as CreateReportInput,
      req.file,
    )
    res.status(201).json({
      success: true,
      message: 'Report submitted for moderation review',
      data: { report },
    })
  },
)

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string }
  const reports = await moderationService.listReportsForModeration(status)
  res.status(200).json({ success: true, data: { reports } })
})

export const takeAction = asyncHandler(async (req: Request, res: Response) => {
  const result = await moderationService.takeModerationAction(
    req.params.reportId,
    requireUserId(req),
    req.body as ModerationActionInput,
  )
  res.status(200).json({
    success: true,
    message: 'Moderation action recorded',
    data: result,
  })
})

export const listActions = asyncHandler(
  async (_req: Request, res: Response) => {
    const actions = await moderationService.listModerationActions()
    res.status(200).json({ success: true, data: { actions } })
  },
)
