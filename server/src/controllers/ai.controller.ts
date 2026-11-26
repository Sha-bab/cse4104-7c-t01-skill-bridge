import { Request, Response } from 'express'
import * as aiService from '../services/ai.service'
import {
  AiPromptInput,
  AiQuizInput,
  IndexResourceInput,
  UploadPrivateNoteInput,
} from '../types/phase5.schema'
import {
  AiExamQuestionsInput,
  AiGenerateSlidesInput,
  AiNoteAnalysisInput,
  AiStudyDeckInput,
  UpdateAiOutputInput,
} from '../types/phase7.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user.userId
}

export const uploadPrivateNote = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await aiService.uploadPrivateNoteForAi(
      requireUserId(req),
      req.body as UploadPrivateNoteInput,
      req.file,
    )
    res.status(201).json({
      success: true,
      message: 'Private AI note indexed',
      data: result,
    })
  },
)

export const indexApprovedResource = asyncHandler(
  async (req: Request, res: Response) => {
    const { note_text } = req.body as IndexResourceInput
    const result = await aiService.indexApprovedResourceForRag(
      req.params.resourceId,
      note_text,
    )
    res.status(200).json({
      success: true,
      message: 'Approved resource indexed for RAG',
      data: result,
    })
  },
)

export const askQuestion = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.askQuestion(
    requireUserId(req),
    req.body as AiPromptInput,
  )
  res.status(200).json({ success: true, data: result })
})

export const generateSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await aiService.generateSummary(
      requireUserId(req),
      req.body as AiPromptInput,
    )
    res.status(200).json({ success: true, data: result })
  },
)

export const generateQuiz = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await aiService.generateQuiz(
      requireUserId(req),
      req.body as AiQuizInput,
    )
    res.status(200).json({ success: true, data: result })
  },
)

export const listHistory = asyncHandler(async (req: Request, res: Response) => {
  const interactions = await aiService.listMyAiHistory(requireUserId(req))
  res.status(200).json({ success: true, data: { interactions } })
})

export const getInteractionDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await aiService.getAiInteractionDetails(
      req.params.interactionId,
      requireUserId(req),
    )
    res.status(200).json({ success: true, data })
  },
)

export const generateFlashcards = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await aiService.generateFlashcards(
      requireUserId(req),
      req.body as AiStudyDeckInput,
    )
    res.status(200).json({ success: true, data })
  },
)

export const generateVivaQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await aiService.generateVivaQuestions(
      requireUserId(req),
      req.body as AiStudyDeckInput,
    )
    res.status(200).json({ success: true, data })
  },
)

export const suggestExamTopics = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await aiService.suggestExamTopics(
      requireUserId(req),
      req.body as AiNoteAnalysisInput,
    )
    res.status(200).json({ success: true, data })
  },
)

export const checkNotesForGaps = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await aiService.checkNotesForGaps(
      requireUserId(req),
      req.body as AiNoteAnalysisInput,
    )
    res.status(200).json({ success: true, data })
  },
)

export const generateSlides = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await aiService.generateLectureSlides(
      requireUserId(req),
      req.body as AiGenerateSlidesInput,
    )
    res.status(200).json({ success: true, data })
  },
)

export const generateExamQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await aiService.generateExamQuestions(
      requireUserId(req),
      req.body as AiExamQuestionsInput,
    )
    res.status(200).json({ success: true, data })
  },
)

export const updateAiOutput = asyncHandler(
  async (req: Request, res: Response) => {
    const output = await aiService.updateAiOutput(
      req.params.outputId,
      requireUserId(req),
      req.body as UpdateAiOutputInput,
    )
    res.status(200).json({
      success: true,
      message: 'AI output updated',
      data: { output },
    })
  },
)
