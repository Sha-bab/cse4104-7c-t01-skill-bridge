import { Router } from 'express'
import { z } from 'zod'
import * as messagingController from '../controllers/messaging.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  createConversationSchema,
  sendMessageSchema,
} from '../types/phase4.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.get('/conversations', messagingController.listMyConversations)
router.post(
  '/conversations',
  validateRequest({ body: createConversationSchema }),
  messagingController.getOrCreateConversation,
)
router.get(
  '/conversations/:conversationId/messages',
  validateRequest({ params: z.object({ conversationId: objectIdSchema }) }),
  messagingController.getMessages,
)
router.post(
  '/conversations/:conversationId/messages',
  validateRequest({
    params: z.object({ conversationId: objectIdSchema }),
    body: sendMessageSchema,
  }),
  messagingController.sendMessage,
)

export default router
