import { Router } from 'express'
import * as starController from '../controllers/star.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import { toggleStarSchema } from '../types/phase3.schema'

const router = Router()

router.use(authenticate)

router.post(
  '/toggle',
  validateRequest({ body: toggleStarSchema }),
  starController.toggleStar,
)
router.get('/me', starController.getMyStars)
router.get('/leaderboard', starController.getLeaderboard)

export default router
