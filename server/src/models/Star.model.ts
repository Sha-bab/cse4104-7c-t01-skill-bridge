import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const STAR_TARGET_TYPES = ['resource', 'feed_post'] as const
export type StarTargetType = (typeof STAR_TARGET_TYPES)[number]

export interface IStar {
  giver_id: Types.ObjectId
  recipient_id: Types.ObjectId
  target_id: Types.ObjectId
  target_type: StarTargetType
  created_at: Date
  updated_at: Date
}

export interface IStarDocument extends IStar, Document {}

const starSchema = new Schema<IStarDocument>(
  {
    giver_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    target_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    target_type: {
      type: String,
      enum: STAR_TARGET_TYPES,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

// Prevent duplicate stars from the same user on the same target
starSchema.index(
  { giver_id: 1, target_id: 1, target_type: 1 },
  { unique: true },
)
starSchema.index({ target_id: 1, target_type: 1 })

export const Star: Model<IStarDocument> =
  mongoose.models.Star || mongoose.model<IStarDocument>('Star', starSchema)
