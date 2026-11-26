import { z } from 'zod'
import { objectIdSchema } from '../utils/objectId'

const baseSourceSchema = z.object({
  resource_id: objectIdSchema.optional(),
  interaction_id: objectIdSchema.optional(),
  topic: z.string().trim().max(300).optional(),
})

export const aiStudyDeckSchema = baseSourceSchema
  .extend({
    count: z.coerce.number().int().min(3).max(25).default(8),
  })
  .refine((d) => !(d.resource_id && d.interaction_id), {
    message: 'Provide either resource_id or interaction_id, not both',
  })

export const aiNoteAnalysisSchema = baseSourceSchema.refine(
  (d) => !(d.resource_id && d.interaction_id),
  { message: 'Provide either resource_id or interaction_id, not both' },
)

export const aiGenerateSlidesSchema = z
  .object({
    topic: z.string().trim().min(3).max(300),
    slide_count: z.coerce.number().int().min(4).max(30).default(10),
    audience_level: z
      .enum(['introductory', 'intermediate', 'advanced'])
      .default('intermediate'),
    resource_id: objectIdSchema.optional(),
    interaction_id: objectIdSchema.optional(),
  })
  .refine((d) => !(d.resource_id && d.interaction_id), {
    message: 'Provide either resource_id or interaction_id, not both',
  })

export const aiExamQuestionsSchema = z
  .object({
    exam_type: z.enum(['CT', 'Mid', 'Final']),
    topic: z.string().trim().min(2).max(300),
    total_marks: z.coerce.number().int().min(5).max(100).default(30),
    preferences: z.string().trim().max(500).optional(),
    resource_id: objectIdSchema.optional(),
    interaction_id: objectIdSchema.optional(),
  })
  .refine((d) => !(d.resource_id && d.interaction_id), {
    message: 'Provide either resource_id or interaction_id, not both',
  })

export const updateAiOutputSchema = z.object({
  generated_response: z.string().trim().min(1).max(30000),
})

export type AiStudyDeckInput = z.infer<typeof aiStudyDeckSchema>
export type AiNoteAnalysisInput = z.infer<typeof aiNoteAnalysisSchema>
export type AiGenerateSlidesInput = z.infer<typeof aiGenerateSlidesSchema>
export type AiExamQuestionsInput = z.infer<typeof aiExamQuestionsSchema>
export type UpdateAiOutputInput = z.infer<typeof updateAiOutputSchema>
