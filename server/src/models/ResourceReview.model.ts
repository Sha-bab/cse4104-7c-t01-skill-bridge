import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IResourceReview {
  resource_id: Types.ObjectId
  reviewer_id: Types.ObjectId
  star_value: number
  review_text?: string
  created_at: Date
  updated_at: Date
}

export interface IResourceReviewDocument extends IResourceReview, Document {}

const resourceReviewSchema = new Schema<IResourceReviewDocument>(
  {
    resource_id: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    reviewer_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    star_value: {
      type: Number,
      required: [true, 'Rating value is required'],
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

// Enforce one rating/review per user per resource
resourceReviewSchema.index(
  { resource_id: 1, reviewer_id: 1 },
  { unique: true },
)

export const ResourceReview: Model<IResourceReviewDocument> =
  mongoose.models.ResourceReview ||
  mongoose.model<IResourceReviewDocument>(
    'ResourceReview',
    resourceReviewSchema,
  )
