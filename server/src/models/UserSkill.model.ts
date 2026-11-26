import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const USER_SKILL_TYPES = ['offered', 'wanted'] as const
export type UserSkillType = (typeof USER_SKILL_TYPES)[number]

export const PROFICIENCY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
] as const
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number]

export interface IUserSkill {
  user_id: Types.ObjectId
  skill_id: Types.ObjectId
  skill_type: UserSkillType
  proficiency_level: ProficiencyLevel
  created_at: Date
  updated_at: Date
}

export interface IUserSkillDocument extends IUserSkill, Document {}

const userSkillSchema = new Schema<IUserSkillDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skill_id: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    skill_type: {
      type: String,
      enum: USER_SKILL_TYPES,
      required: true,
    },
    proficiency_level: {
      type: String,
      enum: PROFICIENCY_LEVELS,
      default: 'intermediate',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

userSkillSchema.index(
  { user_id: 1, skill_id: 1, skill_type: 1 },
  { unique: true },
)
userSkillSchema.index({ skill_id: 1, skill_type: 1 })

export const UserSkill: Model<IUserSkillDocument> =
  mongoose.models.UserSkill ||
  mongoose.model<IUserSkillDocument>('UserSkill', userSkillSchema)
