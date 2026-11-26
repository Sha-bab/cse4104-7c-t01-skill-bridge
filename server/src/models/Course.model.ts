import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface ICourse {
  department_id: Types.ObjectId
  course_code: string
  course_name: string
  semester?: string
  created_at: Date
  updated_at: Date
}

export interface ICourseDocument extends ICourse, Document {}

const courseSchema = new Schema<ICourseDocument>(
  {
    department_id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    course_code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [30, 'Course code cannot exceed 30 characters'],
    },
    course_name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [150, 'Course name cannot exceed 150 characters'],
    },
    semester: {
      type: String,
      trim: true,
      maxlength: [30, 'Semester cannot exceed 30 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

courseSchema.index({ department_id: 1, semester: 1 })
courseSchema.index({ course_name: 'text', course_code: 'text' })

export const Course: Model<ICourseDocument> =
  mongoose.models.Course || mongoose.model<ICourseDocument>('Course', courseSchema)
