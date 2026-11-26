import { z } from 'zod'
import {
  CONVERSATION_TYPES,
  SESSION_MODES,
  SKILL_REQUEST_TYPES,
} from '../models'
import { objectIdSchema } from '../utils/objectId'

export const createSkillRequestSchema = z
  .object({
    skill_id: objectIdSchema,
    request_type: z.enum(SKILL_REQUEST_TYPES),
    recipient_id: objectIdSchema.optional(),
    topic_description: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => data.request_type !== 'direct' || Boolean(data.recipient_id),
    {
      message: 'recipient_id is required for direct skill requests',
      path: ['recipient_id'],
    },
  )

export const respondDirectRequestSchema = z.object({
  action: z.enum(['accept', 'decline']),
})

export const selectMentorSchema = z.object({
  mentor_id: objectIdSchema,
})

export const createSessionSchema = z.object({
  request_id: objectIdSchema,
  session_mode: z.enum(SESSION_MODES),
  scheduled_at: z.coerce.date(),
  meeting_link: z.string().trim().max(1000).optional(),
})

export const updateSessionStatusSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
})

export const createSessionReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  review_text: z.string().trim().max(1000).optional(),
})

export const createConversationSchema = z.object({
  participant_id: objectIdSchema,
  conversation_type: z.enum(CONVERSATION_TYPES).default('direct'),
})

export const sendMessageSchema = z.object({
  message_text: z.string().trim().min(1).max(4000),
})

export type CreateSkillRequestInput = z.infer<typeof createSkillRequestSchema>
export type RespondDirectRequestInput = z.infer<
  typeof respondDirectRequestSchema
>
export type SelectMentorInput = z.infer<typeof selectMentorSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionStatusInput = z.infer<typeof updateSessionStatusSchema>
export type CreateSessionReviewInput = z.infer<typeof createSessionReviewSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
