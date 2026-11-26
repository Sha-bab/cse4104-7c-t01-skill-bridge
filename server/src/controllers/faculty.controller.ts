import { Request, Response } from 'express'
import * as facultyService from '../services/faculty.service'
import {
  CreateClassSeminarInput,
  UpdateResearchInterestStatusInput,
} from '../types/phase6.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user.userId
}

export const createSeminar = asyncHandler(
  async (req: Request, res: Response) => {
    const seminar = await facultyService.createClassSeminar(
      requireUserId(req),
      req.body as CreateClassSeminarInput,
    )
    res.status(201).json({
      success: true,
      message: 'Class/seminar created',
      data: { seminar },
    })
  },
)

export const listSeminars = asyncHandler(
  async (req: Request, res: Response) => {
    const { event_type } = req.query as { event_type?: string }
    const seminars = await facultyService.listClassSeminars(event_type)
    res.status(200).json({ success: true, data: { seminars } })
  },
)

export const listMyResearchInterests = asyncHandler(
  async (req: Request, res: Response) => {
    const interests = await facultyService.listFacultyResearchInterests(
      requireUserId(req),
    )
    res.status(200).json({ success: true, data: { interests } })
  },
)

export const updateResearchInterestStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const interest = await facultyService.updateResearchInterestStatus(
      req.params.interestId,
      requireUserId(req),
      req.body as UpdateResearchInterestStatusInput,
    )
    res.status(200).json({
      success: true,
      message: 'Research interest status updated',
      data: { interest },
    })
  },
)
