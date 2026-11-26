import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const REPORT_TARGET_TYPES = [
  'user',
  'resource',
  'feed_post',
  'message',
] as const
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number]

export const REPORT_STATUSES = [
  'pending',
  'reviewed',
  'dismissed',
  'action_taken',
] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export interface IReport {
  reporter_id: Types.ObjectId
  target_id: Types.ObjectId
  target_type: ReportTargetType
  reason: string
  evidence_url?: string
  status: ReportStatus
  created_at: Date
  updated_at: Date
}

export interface IReportDocument extends IReport, Document {}

const reportSchema = new Schema<IReportDocument>(
  {
    reporter_id: {
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
      enum: REPORT_TARGET_TYPES,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      trim: true,
      maxlength: [1500, 'Reason cannot exceed 1500 characters'],
    },
    evidence_url: {
      type: String,
      trim: true,
      maxlength: [1000, 'Evidence URL cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

reportSchema.index({ status: 1, created_at: -1 })
reportSchema.index({ target_type: 1, target_id: 1 })

export const Report: Model<IReportDocument> =
  mongoose.models.Report || mongoose.model<IReportDocument>('Report', reportSchema)
