import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const RESEARCH_INTEREST_STATUSES = [
  'pending',
  'reviewed',
  'accepted',
  'declined',
] as const
export type ResearchInterestStatus =
  (typeof RESEARCH_INTEREST_STATUSES)[number]

export interface IResearchInterest {
  post_id: Types.ObjectId
  student_id: Types.ObjectId
  faculty_id: Types.ObjectId
  proposal_text?: string
  status: ResearchInterestStatus
  created_at: Date
  updated_at: Date
}

export interface IResearchInterestDocument extends IResearchInterest, Document {}

const researchInterestSchema = new Schema<IResearchInterestDocument>(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: 'FeedPost',
      required: true,
    },
    student_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    faculty_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    proposal_text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Proposal text cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: RESEARCH_INTEREST_STATUSES,
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

researchInterestSchema.index({ post_id: 1, student_id: 1 }, { unique: true })

export const ResearchInterest: Model<IResearchInterestDocument> =
  mongoose.models.ResearchInterest ||
  mongoose.model<IResearchInterestDocument>(
    'ResearchInterest',
    researchInterestSchema,
  )
