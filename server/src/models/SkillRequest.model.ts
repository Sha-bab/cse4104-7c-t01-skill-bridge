import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const SKILL_REQUEST_TYPES = ['direct', 'public'] as const
export type SkillRequestType = (typeof SKILL_REQUEST_TYPES)[number]

export const SKILL_REQUEST_STATUSES = [
  'open',
  'accepted',
  'declined',
  'mentor_selected',
  'completed',
  'cancelled',
] as const
export type SkillRequestStatus = (typeof SKILL_REQUEST_STATUSES)[number]

export interface ISkillRequest {
  learner_id: Types.ObjectId
  skill_id: Types.ObjectId
  recipient_id?: Types.ObjectId
  selected_mentor_id?: Types.ObjectId
  request_type: SkillRequestType
  topic_description?: string
  status: SkillRequestStatus
  created_at: Date
  updated_at: Date
}

export interface ISkillRequestDocument extends ISkillRequest, Document {}

const skillRequestSchema = new Schema<ISkillRequestDocument>(
  {
    learner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skill_id: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    recipient_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    selected_mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    request_type: {
      type: String,
      enum: SKILL_REQUEST_TYPES,
      required: true,
    },
    topic_description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: SKILL_REQUEST_STATUSES,
      default: 'open',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

skillRequestSchema.index({ request_type: 1, status: 1, created_at: -1 })

export const SkillRequest: Model<ISkillRequestDocument> =
  mongoose.models.SkillRequest ||
  mongoose.model<ISkillRequestDocument>('SkillRequest', skillRequestSchema)
