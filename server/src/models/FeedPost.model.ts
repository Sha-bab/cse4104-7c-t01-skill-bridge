import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const FEED_POST_TYPES = [
  'resource_share',
  'finding',
  'achievement',
  'research_assistance',
  'academic_query',
  'announcement',
] as const
export type FeedPostType = (typeof FEED_POST_TYPES)[number]

export const FEED_VISIBILITIES = ['public', 'department', 'course'] as const
export type FeedVisibility = (typeof FEED_VISIBILITIES)[number]

export interface IFeedPost {
  author_id: Types.ObjectId
  content: string
  post_type: FeedPostType
  visibility: FeedVisibility
  attachment_url?: string
  attachment_type?: string
  star_count: number
  created_at: Date
  updated_at: Date
}

export interface IFeedPostDocument extends IFeedPost, Document {}

const feedPostSchema = new Schema<IFeedPostDocument>(
  {
    author_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [5000, 'Post content cannot exceed 5000 characters'],
    },
    post_type: {
      type: String,
      enum: FEED_POST_TYPES,
      default: 'finding',
      required: true,
    },
    visibility: {
      type: String,
      enum: FEED_VISIBILITIES,
      default: 'public',
      required: true,
    },
    attachment_url: {
      type: String,
      trim: true,
      maxlength: [1000, 'Attachment URL cannot exceed 1000 characters'],
    },
    attachment_type: {
      type: String,
      trim: true,
      maxlength: [50, 'Attachment type cannot exceed 50 characters'],
    },
    star_count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

feedPostSchema.index({ post_type: 1, visibility: 1, created_at: -1 })

export const FeedPost: Model<IFeedPostDocument> =
  mongoose.models.FeedPost ||
  mongoose.model<IFeedPostDocument>('FeedPost', feedPostSchema)
