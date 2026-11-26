import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IFacultyProfile {
  user_id: Types.ObjectId
  department_id?: Types.ObjectId
  expertise?: string
  achievements?: string
  created_at: Date
  updated_at: Date
}

export interface IFacultyProfileDocument extends IFacultyProfile, Document {}

const facultyProfileSchema = new Schema<IFacultyProfileDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    department_id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    expertise: {
      type: String,
      trim: true,
      maxlength: [1000, 'Expertise cannot exceed 1000 characters'],
    },
    achievements: {
      type: String,
      trim: true,
      maxlength: [2000, 'Achievements cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

export const FacultyProfile: Model<IFacultyProfileDocument> =
  mongoose.models.FacultyProfile ||
  mongoose.model<IFacultyProfileDocument>('FacultyProfile', facultyProfileSchema)
