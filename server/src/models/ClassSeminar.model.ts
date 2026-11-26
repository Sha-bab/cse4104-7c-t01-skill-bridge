import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const CLASS_SEMINAR_TYPES = [
  'online_class',
  'seminar',
  'workshop',
] as const
export type ClassSeminarType = (typeof CLASS_SEMINAR_TYPES)[number]

export interface IClassSeminar {
  faculty_id: Types.ObjectId
  title: string
  event_type: ClassSeminarType
  scheduled_at: Date
  meeting_link?: string
  created_at: Date
  updated_at: Date
}

export interface IClassSeminarDocument extends IClassSeminar, Document {}

const classSeminarSchema = new Schema<IClassSeminarDocument>(
  {
    faculty_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    event_type: {
      type: String,
      enum: CLASS_SEMINAR_TYPES,
      required: true,
    },
    scheduled_at: {
      type: Date,
      required: true,
      index: true,
    },
    meeting_link: {
      type: String,
      trim: true,
      maxlength: [1000, 'Meeting link cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

export const ClassSeminar: Model<IClassSeminarDocument> =
  mongoose.models.ClassSeminar ||
  mongoose.model<IClassSeminarDocument>('ClassSeminar', classSeminarSchema)
