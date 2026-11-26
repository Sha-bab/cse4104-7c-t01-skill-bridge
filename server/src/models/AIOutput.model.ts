import mongoose, { Document, Model, Schema, Types } from 'mongoose'
import { AI_INTERACTION_TYPES, AIInteractionType } from './AIInteraction.model'

export interface IAIOutput {
  interaction_id: Types.ObjectId
  prompt: string
  generated_response: string
  output_type: AIInteractionType
  citations: string[]
  created_at: Date
  updated_at: Date
}

export interface IAIOutputDocument extends IAIOutput, Document {}

const aiOutputSchema = new Schema<IAIOutputDocument>(
  {
    interaction_id: {
      type: Schema.Types.ObjectId,
      ref: 'AIInteraction',
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    generated_response: {
      type: String,
      required: true,
    },
    output_type: {
      type: String,
      enum: AI_INTERACTION_TYPES,
      required: true,
    },
    citations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

export const AIOutput: Model<IAIOutputDocument> =
  mongoose.models.AIOutput ||
  mongoose.model<IAIOutputDocument>('AIOutput', aiOutputSchema)
