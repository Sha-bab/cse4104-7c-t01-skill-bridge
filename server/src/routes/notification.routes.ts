import { Router } from 'express'
import { z } from 'zod'
import * as notificationController from '../controllers/notification.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.get('/', notificationController.listNotifications)
router.patch('/read-all', notificationController.markAllRead)
router.patch(
  '/:notificationId/read',
  validateRequest({ params: z.object({ notificationId: objectIdSchema }) }),
  notificationController.markRead,
)

export default router
