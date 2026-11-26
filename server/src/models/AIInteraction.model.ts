import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const AI_INTERACTION_TYPES = [
  'qa',
  'summary',
  'quiz',
  'flashcards',
  'viva',
  'exam_topics',
  'note_check',
  'slides',
  'exam_questions',
] as const
export type AIInteractionType = (typeof AI_INTERACTION_TYPES)[number]

export const AI_SOURCE_TYPES = [
  'approved_resource',
  'private_upload',
  'course_topic',
] as const
export type AISourceType = (typeof AI_SOURCE_TYPES)[number]

export interface IAIInteraction {
  user_id: Types.ObjectId
  resource_id?: Types.ObjectId
  interaction_type: AIInteractionType
  source_type: AISourceType
  private_file_url?: string
  private_source_title?: string
  created_at: Date
  updated_at: Date
}

export interface IAIInteractionDocument extends IAIInteraction, Document {}

const aiInteractionSchema = new Schema<IAIInteractionDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resource_id: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
    },
    interaction_type: {
      type: String,
      enum: AI_INTERACTION_TYPES,
      required: true,
    },
    source_type: {
      type: String,
      enum: AI_SOURCE_TYPES,
      required: true,
    },
    private_file_url: {
      type: String,
      trim: true,
    },
    private_source_title: {
      type: String,
      trim: true,
      maxlength: [200, 'Source title cannot exceed 200 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

aiInteractionSchema.index({ user_id: 1, created_at: -1 })

export const AIInteraction: Model<IAIInteractionDocument> =
  mongoose.models.AIInteraction ||
  mongoose.model<IAIInteractionDocument>('AIInteraction', aiInteractionSchema)
