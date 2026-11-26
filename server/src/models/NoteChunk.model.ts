import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export const NOTE_CHUNK_VISIBILITIES = ['public_approved', 'private'] as const
export type NoteChunkVisibility = (typeof NOTE_CHUNK_VISIBILITIES)[number]

export interface INoteChunk {
  owner_id: Types.ObjectId
  resource_id?: Types.ObjectId
  interaction_id?: Types.ObjectId
  visibility: NoteChunkVisibility
  source_title: string
  chunk_index: number
  content: string
  embedding: number[]
  created_at: Date
  updated_at: Date
}

export interface INoteChunkDocument extends INoteChunk, Document {}

const noteChunkSchema = new Schema<INoteChunkDocument>(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resource_id: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      index: true,
    },
    interaction_id: {
      type: Schema.Types.ObjectId,
      ref: 'AIInteraction',
      index: true,
    },
    visibility: {
      type: String,
      enum: NOTE_CHUNK_VISIBILITIES,
      required: true,
    },
    source_title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Source title cannot exceed 200 characters'],
    },
    chunk_index: {
      type: Number,
      required: true,
      min: 0,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

noteChunkSchema.index({ visibility: 1, owner_id: 1, resource_id: 1 })
noteChunkSchema.index({ interaction_id: 1, chunk_index: 1 })

export const NoteChunk: Model<INoteChunkDocument> =
  mongoose.models.NoteChunk ||
  mongoose.model<INoteChunkDocument>('NoteChunk', noteChunkSchema)
