import { Request, Response } from 'express'
import * as skillExchangeService from '../services/skillExchange.service'
import {
  CreateSessionInput,
  CreateSessionReviewInput,
  CreateSkillRequestInput,
  RespondDirectRequestInput,
  SelectMentorInput,
  UpdateSessionStatusInput,
} from '../types/phase4.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user.userId
}

export const createSkillRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const requestDoc = await skillExchangeService.createSkillRequest(
      requireUserId(req),
      req.body as CreateSkillRequestInput,
    )
    res.status(201).json({
      success: true,
      message: 'Skill request created',
      data: { skill_request: requestDoc },
    })
  },
)

export const listPublicRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const { skill_id } = req.query as { skill_id?: string }
    const requests =
      await skillExchangeService.listPublicOpenRequests(skill_id)
    res.status(200).json({ success: true, data: { skill_requests: requests } })
  },
)

export const listMyRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const requests = await skillExchangeService.listMySkillRequests(
      requireUserId(req),
    )
    res.status(200).json({ success: true, data: { skill_requests: requests } })
  },
)

export const respondDirect = asyncHandler(
  async (req: Request, res: Response) => {
    const updated = await skillExchangeService.respondToDirectRequest(
      req.params.requestId,
      requireUserId(req),
      req.body as RespondDirectRequestInput,
    )
    res.status(200).json({
      success: true,
      message: `Skill request ${updated.status}`,
      data: { skill_request: updated },
    })
  },
)

export const volunteer = asyncHandler(async (req: Request, res: Response) => {
  const doc = await skillExchangeService.volunteerForPublicRequest(
    req.params.requestId,
    requireUserId(req),
  )
  res.status(201).json({
    success: true,
    message: 'Volunteered as mentor',
    data: { volunteer: doc },
  })
})

export const listVolunteers = asyncHandler(
  async (req: Request, res: Response) => {
    const volunteers = await skillExchangeService.listVolunteersForRequest(
      req.params.requestId,
      requireUserId(req),
    )
    res.status(200).json({ success: true, data: { volunteers } })
  },
)

export const selectMentor = asyncHandler(
  async (req: Request, res: Response) => {
    const updated = await skillExchangeService.selectMentorForRequest(
      req.params.requestId,
      requireUserId(req),
      req.body as SelectMentorInput,
    )
    res.status(200).json({
      success: true,
      message: 'Mentor selected',
      data: { skill_request: updated },
    })
  },
)

export const createSession = asyncHandler(
  async (req: Request, res: Response) => {
    const session = await skillExchangeService.createSession(
      requireUserId(req),
      req.body as CreateSessionInput,
    )
    res.status(201).json({
      success: true,
      message: 'Learning session scheduled',
      data: { session },
    })
  },
)

export const listMySessions = asyncHandler(
  async (req: Request, res: Response) => {
    const sessions = await skillExchangeService.listMySessions(
      requireUserId(req),
    )
    res.status(200).json({ success: true, data: { sessions } })
  },
)

export const updateSessionStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const session = await skillExchangeService.updateSessionStatus(
      req.params.sessionId,
      requireUserId(req),
      req.body as UpdateSessionStatusInput,
    )
    res.status(200).json({
      success: true,
      message: `Session marked as ${session.status}`,
      data: { session },
    })
  },
)

export const reviewSession = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await skillExchangeService.reviewCompletedSession(
      req.params.sessionId,
      requireUserId(req),
      req.body as CreateSessionReviewInput,
    )
    res.status(201).json({
      success: true,
      message: 'Session review saved',
      data: { review },
    })
  },
)

export const getMentorReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await skillExchangeService.getMentorReviews(
      req.params.mentorId,
    )
    res.status(200).json({ success: true, data })
  },
)

export const adminGetHistory = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await skillExchangeService.adminGetSkillExchangeHistory()
    res.status(200).json({ success: true, data })
  },
)
