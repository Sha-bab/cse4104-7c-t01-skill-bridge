import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IProfile {
  user_id: Types.ObjectId
  department_id?: Types.ObjectId
  profile_picture?: string
  bio?: string
  semester?: string
  section?: string
  created_at: Date
  updated_at: Date
}

export interface IProfileDocument extends IProfile, Document {}

const profileSchema = new Schema<IProfileDocument>(
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
    profile_picture: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

export const Profile: Model<IProfileDocument> =
  mongoose.models.Profile ||
  mongoose.model<IProfileDocument>('Profile', profileSchema)
