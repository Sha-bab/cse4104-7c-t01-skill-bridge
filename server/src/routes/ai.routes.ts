import { Router } from 'express'
import { z } from 'zod'
import * as aiController from '../controllers/ai.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { uploadPrivateAiFile } from '../middleware/upload.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  aiPromptSchema,
  aiQuizSchema,
  indexResourceSchema,
  uploadPrivateNoteSchema,
} from '../types/phase5.schema'
import {
  aiExamQuestionsSchema,
  aiGenerateSlidesSchema,
  aiNoteAnalysisSchema,
  aiStudyDeckSchema,
  updateAiOutputSchema,
} from '../types/phase7.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.post(
  '/private-notes',
  uploadPrivateAiFile,
  validateRequest({ body: uploadPrivateNoteSchema }),
  aiController.uploadPrivateNote,
)

router.post(
  '/resources/:resourceId/index',
  authorize('admin', 'moderator', 'faculty'),
  validateRequest({
    params: z.object({ resourceId: objectIdSchema }),
    body: indexResourceSchema,
  }),
  aiController.indexApprovedResource,
)

router.post(
  '/ask',
  validateRequest({ body: aiPromptSchema }),
  aiController.askQuestion,
)

router.post(
  '/summary',
  validateRequest({ body: aiPromptSchema }),
  aiController.generateSummary,
)

router.post(
  '/quiz',
  validateRequest({ body: aiQuizSchema }),
  aiController.generateQuiz,
)

router.get('/history', aiController.listHistory)

router.get(
  '/interactions/:interactionId',
  validateRequest({ params: z.object({ interactionId: objectIdSchema }) }),
  aiController.getInteractionDetails,
)

// Phase 7: Additional study & faculty AI tools
router.post(
  '/flashcards',
  validateRequest({ body: aiStudyDeckSchema }),
  aiController.generateFlashcards,
)

router.post(
  '/viva',
  validateRequest({ body: aiStudyDeckSchema }),
  aiController.generateVivaQuestions,
)

router.post(
  '/exam-topics',
  validateRequest({ body: aiNoteAnalysisSchema }),
  aiController.suggestExamTopics,
)

router.post(
  '/note-check',
  validateRequest({ body: aiNoteAnalysisSchema }),
  aiController.checkNotesForGaps,
)

router.post(
  '/faculty/slides',
  authorize('faculty', 'admin'),
  validateRequest({ body: aiGenerateSlidesSchema }),
  aiController.generateSlides,
)

router.post(
  '/faculty/exam-questions',
  authorize('faculty', 'admin'),
  validateRequest({ body: aiExamQuestionsSchema }),
  aiController.generateExamQuestions,
)

router.patch(
  '/outputs/:outputId',
  validateRequest({
    params: z.object({ outputId: objectIdSchema }),
    body: updateAiOutputSchema,
  }),
  aiController.updateAiOutput,
)

export default router
