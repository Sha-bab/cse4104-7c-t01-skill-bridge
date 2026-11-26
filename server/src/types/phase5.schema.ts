import { z } from 'zod'
import { objectIdSchema } from '../utils/objectId'

export const uploadPrivateNoteSchema = z.object({
  title: z.string().trim().min(2).max(200),
  note_text: z.string().trim().min(20).max(50000).optional(),
})

export const indexResourceSchema = z.object({
  note_text: z.string().trim().min(20).max(100000).optional(),
})

export const aiPromptSchema = z
  .object({
    prompt: z.string().trim().min(2).max(2000),
    resource_id: objectIdSchema.optional(),
    interaction_id: objectIdSchema.optional(),
  })
  .refine((data) => !(data.resource_id && data.interaction_id), {
    message: 'Provide either resource_id or interaction_id, not both',
  })

export const aiQuizSchema = z
  .object({
    resource_id: objectIdSchema.optional(),
    interaction_id: objectIdSchema.optional(),
    topic: z.string().trim().max(300).optional(),
    num_questions: z.coerce.number().int().min(3).max(20).default(5),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  })
  .refine((data) => !(data.resource_id && data.interaction_id), {
    message: 'Provide either resource_id or interaction_id, not both',
  })

export type UploadPrivateNoteInput = z.infer<typeof uploadPrivateNoteSchema>
export type IndexResourceInput = z.infer<typeof indexResourceSchema>
export type AiPromptInput = z.infer<typeof aiPromptSchema>
export type AiQuizInput = z.infer<typeof aiQuizSchema>
