import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IDepartment {
  department_name: string
  department_code: string
  created_at: Date
  updated_at: Date
}

export interface IDepartmentDocument extends IDepartment, Document {}

const departmentSchema = new Schema<IDepartmentDocument>(
  {
    department_name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [120, 'Department name cannot exceed 120 characters'],
    },
    department_code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Department code cannot exceed 20 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

export const Department: Model<IDepartmentDocument> =
  mongoose.models.Department ||
  mongoose.model<IDepartmentDocument>('Department', departmentSchema)
