import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const MODERATION_ACTION_TYPES = [
  'warn',
  'restrict',
  'suspend',
  'block',
  'dismiss',
  'restore',
] as const
export type ModerationActionType = (typeof MODERATION_ACTION_TYPES)[number]

export interface IModerationAction {
  report_id?: Types.ObjectId
  admin_id: Types.ObjectId
  target_user_id: Types.ObjectId
  action_type: ModerationActionType
  reason: string
  created_at: Date
  updated_at: Date
}

export interface IModerationActionDocument extends IModerationAction, Document {}

const moderationActionSchema = new Schema<IModerationActionDocument>(
  {
    report_id: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      index: true,
    },
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action_type: {
      type: String,
      enum: MODERATION_ACTION_TYPES,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Moderation reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

moderationActionSchema.index({ created_at: -1 })

export const ModerationAction: Model<IModerationActionDocument> =
  mongoose.models.ModerationAction ||
  mongoose.model<IModerationActionDocument>(
    'ModerationAction',
    moderationActionSchema,
  )
