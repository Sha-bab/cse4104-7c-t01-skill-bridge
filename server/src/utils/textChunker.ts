import pdfParse from 'pdf-parse'
import { AppError } from './AppError'

/**
 * Extracts plain text from an uploaded PDF, TXT, or Markdown buffer.
 */
export const extractTextFromBuffer = async (
  buffer: Buffer,
  mimetype: string,
): Promise<string> => {
  if (mimetype === 'application/pdf') {
    const parsed = await pdfParse(buffer)
    const text = parsed.text.trim()
    if (!text) {
      throw new AppError(
        'Could not extract readable text from the PDF file',
        400,
      )
    }
    return text
  }

  if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
    const text = buffer.toString('utf8').trim()
    if (!text) {
      throw new AppError('Uploaded text file is empty', 400)
    }
    return text
  }

  throw new AppError('Unsupported file format for text extraction', 400)
}

/**
 * Splits long text into overlapping chunks for RAG retrieval.
 */
export const chunkText = (
  text: string,
  chunkSize = 900,
  overlap = 150,
): string[] => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  if (normalized.length <= chunkSize) return [normalized]

  const chunks: string[] = []
  let start = 0

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length)

    if (end < normalized.length) {
      const lastSpace = normalized.lastIndexOf(' ', end)
      if (lastSpace > start + Math.floor(chunkSize * 0.5)) {
        end = lastSpace
      }
    }

    const slice = normalized.slice(start, end).trim()
    if (slice) {
      chunks.push(slice)
    }

    if (end >= normalized.length) {
      break
    }

    start = Math.max(end - overlap, start + 1)
  }

  return chunks
}

/**
 * Computes cosine similarity between two numeric embedding vectors.
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
