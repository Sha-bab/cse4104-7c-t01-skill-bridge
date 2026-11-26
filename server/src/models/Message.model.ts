import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IMessage {
  conversation_id: Types.ObjectId
  sender_id: Types.ObjectId
  message_text: string
  created_at: Date
  updated_at: Date
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message_text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

messageSchema.index({ conversation_id: 1, created_at: 1 })

export const Message: Model<IMessageDocument> =
  mongoose.models.Message ||
  mongoose.model<IMessageDocument>('Message', messageSchema)
