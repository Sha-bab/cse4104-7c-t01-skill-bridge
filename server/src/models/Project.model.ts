import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IProject {
  user_id: Types.ObjectId
  project_title: string
  project_link: string
  created_at: Date
  updated_at: Date
}

export interface IProjectDocument extends IProject, Document {}

const projectSchema = new Schema<IProjectDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project_title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [150, 'Project title cannot exceed 150 characters'],
    },
    project_link: {
      type: String,
      required: [true, 'Project link is required'],
      trim: true,
      maxlength: [500, 'Project link cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

export const Project: Model<IProjectDocument> =
  mongoose.models.Project ||
  mongoose.model<IProjectDocument>('Project', projectSchema)
