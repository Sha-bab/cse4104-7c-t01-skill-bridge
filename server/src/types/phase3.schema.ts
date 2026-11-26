import { z } from 'zod'
import {
  RESOURCE_INTERACTION_TYPES,
  RESOURCE_TYPES,
  STAR_TARGET_TYPES,
} from '../models'
import { objectIdSchema } from '../utils/objectId'

export const createResourceSchema = z.object({
  course_id: objectIdSchema,
  faculty_id: objectIdSchema.optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  file_url: z.string().trim().min(1).max(1000).optional(),
  resource_type: z.enum(RESOURCE_TYPES),
  semester: z.string().trim().max(30).optional(),
  section: z.string().trim().max(20).optional(),
})

export const reviewResourceApprovalSchema = z
  .object({
    approval_status: z.enum(['approved', 'rejected']),
    rejection_reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) =>
      data.approval_status !== 'rejected' ||
      Boolean(data.rejection_reason && data.rejection_reason.length >= 3),
    {
      message: 'A rejection reason is required when rejecting a resource',
      path: ['rejection_reason'],
    },
  )

export const resourceInteractionSchema = z.object({
  interaction_type: z.enum(RESOURCE_INTERACTION_TYPES),
})

export const createResourceReviewSchema = z.object({
  star_value: z.coerce.number().int().min(1).max(5),
  review_text: z.string().trim().max(1000).optional(),
})

export const toggleStarSchema = z.object({
  target_id: objectIdSchema,
  target_type: z.enum(STAR_TARGET_TYPES),
})

export type CreateResourceInput = z.infer<typeof createResourceSchema>
export type ReviewResourceApprovalInput = z.infer<
  typeof reviewResourceApprovalSchema
>
export type ResourceInteractionInput = z.infer<typeof resourceInteractionSchema>
export type CreateResourceReviewInput = z.infer<
  typeof createResourceReviewSchema
>
export type ToggleStarInput = z.infer<typeof toggleStarSchema>
