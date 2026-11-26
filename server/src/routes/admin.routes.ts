import { Router } from 'express'
import { z } from 'zod'
import * as adminController from '../controllers/admin.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  updateUserAccountStatusSchema,
  updateVerificationStatusSchema,
} from '../types/phase2.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.get(
  '/users',
  authorize('admin', 'moderator'),
  adminController.listUsers,
)

router.get(
  '/stats/users',
  authorize('admin', 'moderator'),
  adminController.getUserStats,
)

router.get(
  '/stats/dashboard',
  authorize('admin', 'moderator'),
  adminController.getDashboardStats,
)

router.patch(
  '/users/:userId/status',
  authorize('admin', 'moderator'),
  validateRequest({
    params: z.object({ userId: objectIdSchema }),
    body: updateUserAccountStatusSchema,
  }),
  adminController.updateUserStatus,
)

router.patch(
  '/users/:userId/verification',
  authorize('admin'),
  validateRequest({
    params: z.object({ userId: objectIdSchema }),
    body: updateVerificationStatusSchema,
  }),
  adminController.updateUserVerification,
)

router.delete(
  '/users/:userId',
  authorize('admin'),
  validateRequest({ params: z.object({ userId: objectIdSchema }) }),
  adminController.deleteUser,
)

export default router
