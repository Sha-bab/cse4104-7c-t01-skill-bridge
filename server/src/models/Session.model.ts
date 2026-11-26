import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const SESSION_MODES = ['online', 'in_person'] as const
export type SessionMode = (typeof SESSION_MODES)[number]

export const SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export interface ISession {
  request_id: Types.ObjectId
  learner_id: Types.ObjectId
  mentor_id: Types.ObjectId
  session_mode: SessionMode
  scheduled_at: Date
  meeting_link?: string
  status: SessionStatus
  created_at: Date
  updated_at: Date
}

export interface ISessionDocument extends ISession, Document {}

const sessionSchema = new Schema<ISessionDocument>(
  {
    request_id: {
      type: Schema.Types.ObjectId,
      ref: 'SkillRequest',
      required: true,
      index: true,
    },
    learner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    session_mode: {
      type: String,
      enum: SESSION_MODES,
      required: true,
    },
    scheduled_at: {
      type: Date,
      required: true,
    },
    meeting_link: {
      type: String,
      trim: true,
      maxlength: [1000, 'Meeting link or location cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: SESSION_STATUSES,
      default: 'scheduled',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

sessionSchema.index({ learner_id: 1, status: 1, scheduled_at: 1 })
sessionSchema.index({ mentor_id: 1, status: 1, scheduled_at: 1 })

export const Session: Model<ISessionDocument> =
  mongoose.models.Session ||
  mongoose.model<ISessionDocument>('Session', sessionSchema)
