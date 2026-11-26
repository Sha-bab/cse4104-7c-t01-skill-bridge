import crypto from 'crypto'
import fs from 'fs'
import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import { Request } from 'express'
import { AppError } from '../utils/AppError'

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads')

const RESOURCE_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
}

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const PRIVATE_AI_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
])

const createDiskStorage = (
  subDir: string,
  allowedMimes: Record<string, string>,
) => {
  const targetDir = path.join(UPLOAD_ROOT, subDir)
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(targetDir, { recursive: true })
      cb(null, targetDir)
    },
    filename: (_req, file, cb) => {
      const ext = allowedMimes[file.mimetype] ?? ''
      cb(null, `${crypto.randomUUID()}${ext}`)
    },
  })
}

const createMimeFilter =
  (allowedMimes: Set<string>, errorMessage: string) =>
  (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new AppError(errorMessage, 400))
      return
    }
    cb(null, true)
  }

export const uploadResourceFile = multer({
  storage: createDiskStorage('resources', RESOURCE_MIME_TO_EXT),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: createMimeFilter(
    new Set(Object.keys(RESOURCE_MIME_TO_EXT)),
    'Unsupported file type. Allowed: PDF, DOCX, PPT/PPTX, MP4, WebM',
  ),
}).single('file')

export const uploadEvidenceImage = multer({
  storage: createDiskStorage('evidence', IMAGE_MIME_TO_EXT),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: createMimeFilter(
    new Set(Object.keys(IMAGE_MIME_TO_EXT)),
    'Unsupported image type. Allowed: JPEG, PNG, WebP',
  ),
}).single('screenshot')

export const uploadPrivateAiFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: createMimeFilter(
    PRIVATE_AI_MIMES,
    'Unsupported AI note file type. Allowed: PDF, TXT, Markdown',
  ),
}).single('file')
