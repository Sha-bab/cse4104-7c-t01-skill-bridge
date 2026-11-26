import { z } from 'zod'
import {
  CLASS_SEMINAR_TYPES,
  FEED_POST_TYPES,
  FEED_VISIBILITIES,
  MODERATION_ACTION_TYPES,
  REPORT_TARGET_TYPES,
  RESEARCH_INTEREST_STATUSES,
} from '../models'
import { objectIdSchema } from '../utils/objectId'

export const createFeedPostSchema = z.object({
  content: z.string().trim().min(2).max(5000),
  post_type: z.enum(FEED_POST_TYPES).default('finding'),
  visibility: z.enum(FEED_VISIBILITIES).default('public'),
  attachment_url: z.string().trim().max(1000).optional(),
  attachment_type: z.string().trim().max(50).optional(),
})

export const expressResearchInterestSchema = z.object({
  proposal_text: z.string().trim().max(2000).optional(),
})

export const updateResearchInterestStatusSchema = z.object({
  status: z.enum(RESEARCH_INTEREST_STATUSES),
})

export const createClassSeminarSchema = z.object({
  title: z.string().trim().min(3).max(200),
  event_type: z.enum(CLASS_SEMINAR_TYPES),
  scheduled_at: z.coerce.date(),
  meeting_link: z.string().trim().max(1000).optional(),
})

export const createReportSchema = z.object({
  target_id: objectIdSchema,
  target_type: z.enum(REPORT_TARGET_TYPES),
  reason: z.string().trim().min(5).max(1500),
  evidence_url: z.string().trim().max(1000).optional(),
})

export const moderationActionSchema = z.object({
  target_user_id: objectIdSchema.optional(),
  action_type: z.enum(MODERATION_ACTION_TYPES),
  reason: z.string().trim().min(3).max(1000),
})

export type CreateFeedPostInput = z.infer<typeof createFeedPostSchema>
export type ExpressResearchInterestInput = z.infer<
  typeof expressResearchInterestSchema
>
export type UpdateResearchInterestStatusInput = z.infer<
  typeof updateResearchInterestStatusSchema
>
export type CreateClassSeminarInput = z.infer<typeof createClassSeminarSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
export type ModerationActionInput = z.infer<typeof moderationActionSchema>
