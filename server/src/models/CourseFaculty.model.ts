import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface ICourseFaculty {
  course_id: Types.ObjectId
  faculty_id: Types.ObjectId
  created_at: Date
  updated_at: Date
}

export interface ICourseFacultyDocument extends ICourseFaculty, Document {}

const courseFacultySchema = new Schema<ICourseFacultyDocument>(
  {
    course_id: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    faculty_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

courseFacultySchema.index({ course_id: 1, faculty_id: 1 }, { unique: true })
courseFacultySchema.index({ faculty_id: 1 })

export const CourseFaculty: Model<ICourseFacultyDocument> =
  mongoose.models.CourseFaculty ||
  mongoose.model<ICourseFacultyDocument>('CourseFaculty', courseFacultySchema)
