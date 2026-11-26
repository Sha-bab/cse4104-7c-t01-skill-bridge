import mongoose, { Document, Model, Schema } from 'mongoose'

export const USER_ROLES = ['student', 'faculty', 'moderator', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const ACCOUNT_STATUSES = [
  'active',
  'restricted',
  'suspended',
  'blocked',
  'deleted',
] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export interface IUser {
  name: string
  email: string
  institutional_id?: string
  password_hash: string
  role: UserRole
  is_email_verified: boolean
  verification_status: VerificationStatus
  account_status: AccountStatus
  restriction_reason?: string
  refresh_token_hash?: string
  created_at: Date
  updated_at: Date
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    institutional_id: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      maxlength: [50, 'Institutional ID cannot exceed 50 characters'],
    },
    password_hash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'student',
      required: true,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
      required: true,
    },
    verification_status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'pending',
      required: true,
    },
    account_status: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: 'active',
      required: true,
    },
    restriction_reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Restriction reason cannot exceed 500 characters'],
    },
    refresh_token_hash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password_hash
        delete ret.refresh_token_hash
        delete ret.__v
        return ret
      },
    },
  },
)

userSchema.index({ role: 1, account_status: 1 })
userSchema.index({ verification_status: 1 })

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema)
