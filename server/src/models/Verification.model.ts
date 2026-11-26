import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const VERIFICATION_TYPES = [
  'email_otp',
  'password_reset',
  'institutional_id',
] as const
export type VerificationType = (typeof VERIFICATION_TYPES)[number]

export const VERIFICATION_RECORD_STATUSES = [
  'pending',
  'verified',
  'expired',
  'failed',
] as const
export type VerificationRecordStatus =
  (typeof VERIFICATION_RECORD_STATUSES)[number]

export interface IVerification {
  user_id: Types.ObjectId
  verification_type: VerificationType
  otp_hash: string
  status: VerificationRecordStatus
  expires_at: Date
  attempts: number
  created_at: Date
  updated_at: Date
}

export interface IVerificationDocument extends IVerification, Document {}

const verificationSchema = new Schema<IVerificationDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verification_type: {
      type: String,
      enum: VERIFICATION_TYPES,
      default: 'email_otp',
      required: true,
    },
    otp_hash: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: VERIFICATION_RECORD_STATUSES,
      default: 'pending',
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
)

verificationSchema.index({ user_id: 1, verification_type: 1, status: 1 })

export const Verification: Model<IVerificationDocument> =
  mongoose.models.Verification ||
  mongoose.model<IVerificationDocument>('Verification', verificationSchema)
