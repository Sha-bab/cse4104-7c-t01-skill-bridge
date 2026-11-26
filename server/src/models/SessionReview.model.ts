import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface ISessionReview {
  session_id: Types.ObjectId
  reviewer_id: Types.ObjectId
  mentor_id: Types.ObjectId
  rating: number
  review_text?: string
  created_at: Date
  updated_at: Date
}

export interface ISessionReviewDocument extends ISessionReview, Document {}

const sessionReviewSchema = new Schema<ISessionReviewDocument>(
  {
    session_id: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    reviewer_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    review_text: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review text cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

sessionReviewSchema.index({ session_id: 1, reviewer_id: 1 }, { unique: true })

export const SessionReview: Model<ISessionReviewDocument> =
  mongoose.models.SessionReview ||
  mongoose.model<ISessionReviewDocument>('SessionReview', sessionReviewSchema)
