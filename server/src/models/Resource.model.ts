import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const RESOURCE_TYPES = ['pdf', 'docx', 'slides', 'video', 'note'] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export interface IResource {
  uploader_id: Types.ObjectId
  course_id: Types.ObjectId
  faculty_id?: Types.ObjectId
  reviewed_by?: Types.ObjectId
  title: string
  description?: string
  file_url: string
  resource_type: ResourceType
  mime_type?: string
  file_size?: number
  semester?: string
  section?: string
  approval_status: ApprovalStatus
  rejection_reason?: string
  reviewed_at?: Date
  view_count: number
  download_count: number
  star_count: number
  review_count: number
  average_rating: number
  created_at: Date
  updated_at: Date
}

export interface IResourceDocument extends IResource, Document {}

const resourceSchema = new Schema<IResourceDocument>(
  {
    uploader_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course_id: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    faculty_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    file_url: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
      maxlength: [1000, 'File URL cannot exceed 1000 characters'],
    },
    resource_type: {
      type: String,
      enum: RESOURCE_TYPES,
      required: true,
    },
    mime_type: {
      type: String,
      trim: true,
    },
    file_size: {
      type: Number,
      min: 0,
    },
    semester: {
      type: String,
      trim: true,
      maxlength: [30, 'Semester cannot exceed 30 characters'],
    },
    section: {
      type: String,
      trim: true,
      maxlength: [20, 'Section cannot exceed 20 characters'],
    },
    approval_status: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: 'pending',
      required: true,
    },
    rejection_reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    reviewed_at: {
      type: Date,
    },
    view_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    download_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    star_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    review_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    average_rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

resourceSchema.index({ approval_status: 1, course_id: 1, created_at: -1 })
resourceSchema.index({ uploader_id: 1, created_at: -1 })
resourceSchema.index({ title: 'text', description: 'text' })

export const Resource: Model<IResourceDocument> =
  mongoose.models.Resource ||
  mongoose.model<IResourceDocument>('Resource', resourceSchema)
