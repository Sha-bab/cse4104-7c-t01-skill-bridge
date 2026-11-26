import { Router } from 'express'
import { z } from 'zod'
import * as facultyController from '../controllers/faculty.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  createClassSeminarSchema,
  updateResearchInterestStatusSchema,
} from '../types/phase6.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.get('/seminars', facultyController.listSeminars)
router.post(
  '/seminars',
  authorize('faculty'),
  validateRequest({ body: createClassSeminarSchema }),
  facultyController.createSeminar,
)

router.get(
  '/research-interests',
  authorize('faculty'),
  facultyController.listMyResearchInterests,
)

router.patch(
  '/research-interests/:interestId',
  authorize('faculty'),
  validateRequest({
    params: z.object({ interestId: objectIdSchema }),
    body: updateResearchInterestStatusSchema,
  }),
  facultyController.updateResearchInterestStatus,
)

export default router
