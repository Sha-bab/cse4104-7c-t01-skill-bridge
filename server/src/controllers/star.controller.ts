import { Request, Response } from 'express'
import * as starService from '../services/star.service'
import { ToggleStarInput } from '../types/phase3.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

export const toggleStar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401)
  const result = await starService.toggleStar(
    req.user.userId,
    req.body as ToggleStarInput,
  )
  res.status(200).json({
    success: true,
    message: result.starred ? 'Star added' : 'Star removed',
    data: result,
  })
})

export const getMyStars = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401)
  const summary = await starService.getMyStarSummary(req.user.userId)
  res.status(200).json({ success: true, data: summary })
})

export const getLeaderboard = asyncHandler(
  async (req: Request, res: Response) => {
    const limitParam = Number(req.query.limit ?? 20)
    const leaderboard = await starService.getStarLeaderboard(
      Number.isFinite(limitParam) ? limitParam : 20,
    )
    res.status(200).json({ success: true, data: { leaderboard } })
  },
)
