import { Router } from 'express'
import { z } from 'zod'
import * as resourceController from '../controllers/resource.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { uploadResourceFile } from '../middleware/upload.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  createResourceReviewSchema,
  createResourceSchema,
  resourceInteractionSchema,
  reviewResourceApprovalSchema,
} from '../types/phase3.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.get('/', resourceController.listApprovedResources)
router.get('/mine', resourceController.listMyResources)
router.get(
  '/pending',
  authorize('admin', 'moderator'),
  resourceController.listPendingResources,
)

router.post(
  '/',
  uploadResourceFile,
  validateRequest({ body: createResourceSchema }),
  resourceController.createResource,
)

router.get(
  '/:resourceId',
  validateRequest({ params: z.object({ resourceId: objectIdSchema }) }),
  resourceController.getResourceById,
)

router.patch(
  '/:resourceId/approval',
  authorize('admin', 'moderator'),
  validateRequest({
    params: z.object({ resourceId: objectIdSchema }),
    body: reviewResourceApprovalSchema,
  }),
  resourceController.reviewApproval,
)

router.post(
  '/:resourceId/interact',
  validateRequest({
    params: z.object({ resourceId: objectIdSchema }),
    body: resourceInteractionSchema,
  }),
  resourceController.recordInteraction,
)

router.get(
  '/:resourceId/stats',
  validateRequest({ params: z.object({ resourceId: objectIdSchema }) }),
  resourceController.getResourceStats,
)

router.get(
  '/:resourceId/reviews',
  validateRequest({ params: z.object({ resourceId: objectIdSchema }) }),
  resourceController.listReviews,
)

router.post(
  '/:resourceId/reviews',
  validateRequest({
    params: z.object({ resourceId: objectIdSchema }),
    body: createResourceReviewSchema,
  }),
  resourceController.upsertReview,
)

export default router
