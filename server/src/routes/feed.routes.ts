import { Router } from 'express'
import { z } from 'zod'
import * as feedController from '../controllers/feed.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  createFeedPostSchema,
  expressResearchInterestSchema,
} from '../types/phase6.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.get('/', feedController.listPosts)
router.post(
  '/',
  validateRequest({ body: createFeedPostSchema }),
  feedController.createPost,
)

router.post(
  '/:postId/interest',
  authorize('student'),
  validateRequest({
    params: z.object({ postId: objectIdSchema }),
    body: expressResearchInterestSchema,
  }),
  feedController.expressInterest,
)

export default router
