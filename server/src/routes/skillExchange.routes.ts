import { Router } from 'express'
import { z } from 'zod'
import * as skillExchangeController from '../controllers/skillExchange.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  createSessionReviewSchema,
  createSessionSchema,
  createSkillRequestSchema,
  respondDirectRequestSchema,
  selectMentorSchema,
  updateSessionStatusSchema,
} from '../types/phase4.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

// Skill requests
router.get('/requests/public', skillExchangeController.listPublicRequests)
router.get('/requests/mine', skillExchangeController.listMyRequests)
router.post(
  '/requests',
  validateRequest({ body: createSkillRequestSchema }),
  skillExchangeController.createSkillRequest,
)
router.patch(
  '/requests/:requestId/respond',
  validateRequest({
    params: z.object({ requestId: objectIdSchema }),
    body: respondDirectRequestSchema,
  }),
  skillExchangeController.respondDirect,
)
router.post(
  '/requests/:requestId/volunteer',
  validateRequest({ params: z.object({ requestId: objectIdSchema }) }),
  skillExchangeController.volunteer,
)
router.get(
  '/requests/:requestId/volunteers',
  validateRequest({ params: z.object({ requestId: objectIdSchema }) }),
  skillExchangeController.listVolunteers,
)
router.post(
  '/requests/:requestId/select-mentor',
  validateRequest({
    params: z.object({ requestId: objectIdSchema }),
    body: selectMentorSchema,
  }),
  skillExchangeController.selectMentor,
)

// Sessions & reviews
router.get('/sessions/mine', skillExchangeController.listMySessions)
router.post(
  '/sessions',
  validateRequest({ body: createSessionSchema }),
  skillExchangeController.createSession,
)
router.patch(
  '/sessions/:sessionId/status',
  validateRequest({
    params: z.object({ sessionId: objectIdSchema }),
    body: updateSessionStatusSchema,
  }),
  skillExchangeController.updateSessionStatus,
)
router.post(
  '/sessions/:sessionId/review',
  validateRequest({
    params: z.object({ sessionId: objectIdSchema }),
    body: createSessionReviewSchema,
  }),
  skillExchangeController.reviewSession,
)
router.get(
  '/mentors/:mentorId/reviews',
  validateRequest({ params: z.object({ mentorId: objectIdSchema }) }),
  skillExchangeController.getMentorReviews,
)

// Admin oversight (FR-57)
router.get(
  '/admin/history',
  authorize('admin', 'moderator'),
  skillExchangeController.adminGetHistory,
)

export default router
