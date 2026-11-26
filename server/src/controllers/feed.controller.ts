import { Request, Response } from 'express'
import * as feedService from '../services/feed.service'
import {
  CreateFeedPostInput,
  ExpressResearchInterestInput,
} from '../types/phase6.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUser = (req: Request) => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user
}

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req)
  const post = await feedService.createFeedPost(
    user.userId,
    user.role,
    req.body as CreateFeedPostInput,
  )
  res.status(201).json({
    success: true,
    message: 'Post published to feed',
    data: { post },
  })
})

export const listPosts = asyncHandler(async (req: Request, res: Response) => {
  const { post_type, visibility, q } = req.query as Record<
    string,
    string | undefined
  >
  const posts = await feedService.listFeedPosts({ post_type, visibility, q })
  res.status(200).json({ success: true, data: { posts } })
})

export const expressInterest = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireUser(req)
    const result = await feedService.expressResearchInterest(
      req.params.postId,
      user.userId,
      req.body as ExpressResearchInterestInput,
    )
    res.status(201).json({
      success: true,
      message: 'Research interest submitted and faculty notified',
      data: result,
    })
  },
)
