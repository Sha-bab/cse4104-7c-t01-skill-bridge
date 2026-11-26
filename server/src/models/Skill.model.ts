import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ISkill {
  skill_name: string
  category: string
  created_at: Date
  updated_at: Date
}

export interface ISkillDocument extends ISkill, Document {}

const skillSchema = new Schema<ISkillDocument>(
  {
    skill_name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      maxlength: [80, 'Skill name cannot exceed 80 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [60, 'Category cannot exceed 60 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

skillSchema.index({ category: 1 })
skillSchema.index({ skill_name: 'text', category: 'text' })

export const Skill: Model<ISkillDocument> =
  mongoose.models.Skill || mongoose.model<ISkillDocument>('Skill', skillSchema)
