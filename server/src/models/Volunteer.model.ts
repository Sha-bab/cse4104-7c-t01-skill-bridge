import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const VOLUNTEER_STATUSES = [
  'pending',
  'selected',
  'declined',
  'withdrawn',
] as const
export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number]

export interface IVolunteer {
  request_id: Types.ObjectId
  volunteer_id: Types.ObjectId
  status: VolunteerStatus
  created_at: Date
  updated_at: Date
}

export interface IVolunteerDocument extends IVolunteer, Document {}

const volunteerSchema = new Schema<IVolunteerDocument>(
  {
    request_id: {
      type: Schema.Types.ObjectId,
      ref: 'SkillRequest',
      required: true,
    },
    volunteer_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: VOLUNTEER_STATUSES,
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

volunteerSchema.index({ request_id: 1, volunteer_id: 1 }, { unique: true })
volunteerSchema.index({ volunteer_id: 1, status: 1 })

export const Volunteer: Model<IVolunteerDocument> =
  mongoose.models.Volunteer ||
  mongoose.model<IVolunteerDocument>('Volunteer', volunteerSchema)
