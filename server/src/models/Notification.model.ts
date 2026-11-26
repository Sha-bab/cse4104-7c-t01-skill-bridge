import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const NOTIFICATION_RELATED_TYPES = [
  'resource',
  'skill_request',
  'session',
  'research_interest',
  'feed_post',
  'moderation',
  'system',
] as const
export type NotificationRelatedType =
  (typeof NOTIFICATION_RELATED_TYPES)[number]

export interface INotification {
  recipient_id: Types.ObjectId
  sender_id?: Types.ObjectId
  related_id?: Types.ObjectId
  related_type: NotificationRelatedType
  notification_type: string
  message: string
  is_read: boolean
  created_at: Date
  updated_at: Date
}

export interface INotificationDocument extends INotification, Document {}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    related_id: {
      type: Schema.Types.ObjectId,
    },
    related_type: {
      type: String,
      enum: NOTIFICATION_RELATED_TYPES,
      default: 'system',
      required: true,
    },
    notification_type: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, 'Notification type cannot exceed 80 characters'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    is_read: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

notificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 })

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>('Notification', notificationSchema)
