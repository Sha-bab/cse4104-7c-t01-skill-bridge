import { Router } from 'express'
import { z } from 'zod'
import * as moderationController from '../controllers/moderation.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { uploadEvidenceImage } from '../middleware/upload.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  createReportSchema,
  moderationActionSchema,
} from '../types/phase6.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

// Any authenticated user can report a violation with optional screenshot evidence (FR-33)
router.post(
  '/reports',
  uploadEvidenceImage,
  validateRequest({ body: createReportSchema }),
  moderationController.submitReport,
)

// Restricted to administrators and moderators (NFR-10, FR-53)
router.get(
  '/reports',
  authorize('admin', 'moderator'),
  moderationController.listReports,
)

router.post(
  '/reports/:reportId/action',
  authorize('admin', 'moderator'),
  validateRequest({
    params: z.object({ reportId: objectIdSchema }),
    body: moderationActionSchema,
  }),
  moderationController.takeAction,
)

router.get(
  '/actions',
  authorize('admin', 'moderator'),
  moderationController.listActions,
)

export default router
