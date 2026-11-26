import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const CONVERSATION_TYPES = [
  'direct',
  'skill_exchange',
  'academic',
] as const
export type ConversationType = (typeof CONVERSATION_TYPES)[number]

export interface IConversation {
  participants: Types.ObjectId[]
  conversation_type: ConversationType
  last_message_at?: Date
  created_at: Date
  updated_at: Date
}

export interface IConversationDocument extends IConversation, Document {}

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: {
        validator: (arr: Types.ObjectId[]) => arr.length >= 2,
        message: 'A conversation must include at least 2 participants',
      },
      required: true,
    },
    conversation_type: {
      type: String,
      enum: CONVERSATION_TYPES,
      default: 'direct',
      required: true,
    },
    last_message_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

conversationSchema.index({ participants: 1, last_message_at: -1 })

export const Conversation: Model<IConversationDocument> =
  mongoose.models.Conversation ||
  mongoose.model<IConversationDocument>('Conversation', conversationSchema)
