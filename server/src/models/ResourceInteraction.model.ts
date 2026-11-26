import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const RESOURCE_INTERACTION_TYPES = ['view', 'download'] as const
export type ResourceInteractionType = (typeof RESOURCE_INTERACTION_TYPES)[number]

export interface IResourceInteraction {
  resource_id: Types.ObjectId
  user_id: Types.ObjectId
  interaction_type: ResourceInteractionType
  created_at: Date
  updated_at: Date
}

export interface IResourceInteractionDocument
  extends IResourceInteraction,
    Document {}

const resourceInteractionSchema = new Schema<IResourceInteractionDocument>(
  {
    resource_id: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interaction_type: {
      type: String,
      enum: RESOURCE_INTERACTION_TYPES,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

resourceInteractionSchema.index({
  resource_id: 1,
  interaction_type: 1,
  user_id: 1,
})

export const ResourceInteraction: Model<IResourceInteractionDocument> =
  mongoose.models.ResourceInteraction ||
  mongoose.model<IResourceInteractionDocument>(
    'ResourceInteraction',
    resourceInteractionSchema,
  )
