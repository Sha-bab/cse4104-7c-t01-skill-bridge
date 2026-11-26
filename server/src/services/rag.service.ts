import { FilterQuery } from 'mongoose'
import { env } from '../config/env'
import { INoteChunkDocument, NoteChunk, Resource } from '../models'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'
import { chunkText, cosineSimilarity } from '../utils/textChunker'
import { createEmbedding } from './llm.service'

export const indexApprovedResourceText = async (
  resourceId: string,
  rawText: string,
): Promise<{ chunk_count: number }> => {
  const rid = toObjectId(resourceId, 'resourceId')
  const resource = await Resource.findOne({
    _id: rid,
    approval_status: 'approved',
  })

  if (!resource) {
    throw new AppError(
      'Only approved resources can be indexed for public RAG search',
      400,
    )
  }

  const chunks = chunkText(rawText)
  if (chunks.length === 0) {
    throw new AppError('No text content available to index', 400)
  }

  await NoteChunk.deleteMany({ resource_id: rid, visibility: 'public_approved' })

  const docs = await Promise.all(
    chunks.map(async (content, index) => ({
      owner_id: resource.uploader_id,
      resource_id: rid,
      visibility: 'public_approved' as const,
      source_title: resource.title,
      chunk_index: index,
      content,
      embedding: await createEmbedding(content),
    })),
  )

  await NoteChunk.insertMany(docs)
  return { chunk_count: docs.length }
}

export const indexPrivateNoteText = async (
  ownerId: string,
  interactionId: string,
  sourceTitle: string,
  rawText: string,
): Promise<{ chunk_count: number }> => {
  const uid = toObjectId(ownerId, 'ownerId')
  const iid = toObjectId(interactionId, 'interactionId')

  const chunks = chunkText(rawText)
  if (chunks.length === 0) {
    throw new AppError('No text content found in private note', 400)
  }

  const docs = await Promise.all(
    chunks.map(async (content, index) => ({
      owner_id: uid,
      interaction_id: iid,
      // Security rule (NFR-20): Private AI uploads must never become public
      visibility: 'private' as const,
      source_title: sourceTitle,
      chunk_index: index,
      content,
      embedding: await createEmbedding(content),
    })),
  )

  await NoteChunk.insertMany(docs)
  return { chunk_count: docs.length }
}

export const retrieveRelevantChunks = async (params: {
  userId: string
  query: string
  resourceId?: string
  interactionId?: string
  limit?: number
}): Promise<INoteChunkDocument[]> => {
  const uid = toObjectId(params.userId, 'userId')
  const limit = params.limit ?? 5

  let matchFilter: FilterQuery<INoteChunkDocument>

  if (params.interactionId) {
    matchFilter = {
      interaction_id: toObjectId(params.interactionId, 'interaction_id'),
      owner_id: uid,
      visibility: 'private',
    }
  } else if (params.resourceId) {
    matchFilter = {
      resource_id: toObjectId(params.resourceId, 'resource_id'),
      visibility: 'public_approved',
    }
  } else {
    matchFilter = {
      $or: [
        { visibility: 'public_approved' },
        { visibility: 'private', owner_id: uid },
      ],
    }
  }

  const queryVector = await createEmbedding(params.query)

  // Try MongoDB Atlas Vector Search first; fall back cleanly if index is absent
  try {
    const vectorResults = await NoteChunk.aggregate<INoteChunkDocument>([
      {
        $vectorSearch: {
          index: env.ATLAS_VECTOR_INDEX,
          path: 'embedding',
          queryVector,
          numCandidates: limit * 10,
          limit,
          filter: matchFilter,
        },
      },
    ])
    if (vectorResults.length > 0) {
      return vectorResults
    }
  } catch {
    // Expected on non-Atlas MongoDB or before creating the Atlas vector index
  }

  const candidates = await NoteChunk.find(matchFilter).limit(200)
  const queryWords = new Set(
    params.query
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2),
  )

  const scored = candidates.map((chunk) => {
    const vecScore = cosineSimilarity(queryVector, chunk.embedding)
    const lowerContent = chunk.content.toLowerCase()
    let keywordHits = 0
    for (const word of queryWords) {
      if (lowerContent.includes(word)) keywordHits += 1
    }
    const keywordScore =
      queryWords.size > 0 ? keywordHits / queryWords.size : 0
    return { chunk, score: vecScore * 0.7 + keywordScore * 0.3 }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((item) => item.chunk)
}
