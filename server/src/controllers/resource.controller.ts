import { Request, Response } from 'express'
import * as resourceService from '../services/resource.service'
import {
  CreateResourceInput,
  CreateResourceReviewInput,
  ResourceInteractionInput,
  ReviewResourceApprovalInput,
} from '../types/phase3.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

export const createResource = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const resource = await resourceService.createResource(
      req.user.userId,
      req.body as CreateResourceInput,
      req.file,
    )
    res.status(201).json({
      success: true,
      message: 'Resource submitted and awaiting admin approval',
      data: { resource },
    })
  },
)

export const listApprovedResources = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      course_id,
      faculty_id,
      semester,
      section,
      resource_type,
      q,
    } = req.query as Record<string, string | undefined>

    const resources = await resourceService.listApprovedResources({
      course_id,
      faculty_id,
      semester,
      section,
      resource_type,
      q,
    })
    res.status(200).json({ success: true, data: { resources } })
  },
)

export const listMyResources = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const resources = await resourceService.listMyResources(req.user.userId)
    res.status(200).json({ success: true, data: { resources } })
  },
)

export const listPendingResources = asyncHandler(
  async (_req: Request, res: Response) => {
    const resources = await resourceService.listPendingResources()
    res.status(200).json({ success: true, data: { resources } })
  },
)

export const getResourceById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const resource = await resourceService.getResourceById(
      req.params.resourceId,
      req.user.userId,
      req.user.role,
    )
    res.status(200).json({ success: true, data: { resource } })
  },
)

export const reviewApproval = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const resource = await resourceService.reviewResourceApproval(
      req.params.resourceId,
      req.user.userId,
      req.body as ReviewResourceApprovalInput,
    )
    res.status(200).json({
      success: true,
      message: `Resource ${resource.approval_status}`,
      data: { resource },
    })
  },
)

export const recordInteraction = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const resource = await resourceService.recordInteraction(
      req.params.resourceId,
      req.user.userId,
      req.body as ResourceInteractionInput,
    )
    res.status(200).json({
      success: true,
      message: 'Interaction recorded',
      data: { resource },
    })
  },
)

export const getResourceStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const stats = await resourceService.getResourceStats(
      req.params.resourceId,
      req.user.userId,
      req.user.role,
    )
    res.status(200).json({ success: true, data: stats })
  },
)

export const upsertReview = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Authentication required', 401)
    const review = await resourceService.upsertResourceReview(
      req.params.resourceId,
      req.user.userId,
      req.body as CreateResourceReviewInput,
    )
    res.status(201).json({
      success: true,
      message: 'Review saved',
      data: { review },
    })
  },
)

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await resourceService.listResourceReviews(
    req.params.resourceId,
  )
  res.status(200).json({ success: true, data: { reviews } })
})
