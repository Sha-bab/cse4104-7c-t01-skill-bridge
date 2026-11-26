import fs from 'fs/promises'
import path from 'path'
import {
  AIInteraction,
  AIInteractionType,
  AIOutput,
  INoteChunkDocument,
  NoteChunk,
  Resource,
} from '../models'
import {
  AiPromptInput,
  AiQuizInput,
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
import { toObjectId } from '../utils/objectId'
import { extractTextFromBuffer } from '../utils/textChunker'
import { generateAiText } from './llm.service'
import {
  indexApprovedResourceText,
  indexPrivateNoteText,
  retrieveRelevantChunks,
} from './rag.service'

const buildContextAndCitations = (chunks: INoteChunkDocument[]) => {
  const citations = Array.from(
    new Set(
      chunks.map(
        (c) => `${c.source_title} (chunk #${c.chunk_index + 1})`,
      ),
    ),
  )
  const contextText = chunks
    .map(
      (c) =>
        `[Source: ${c.source_title}, Chunk #${c.chunk_index + 1}]\n${c.content}`,
    )
    .join('\n\n---\n\n')

  return { citations, contextText }
}

export const uploadPrivateNoteForAi = async (
  userId: string,
  input: UploadPrivateNoteInput,
  file?: Express.Multer.File,
) => {
  let extractedText = input.note_text?.trim() ?? ''

  if (file) {
    extractedText = await extractTextFromBuffer(file.buffer, file.mimetype)
  }

  if (!extractedText || extractedText.length < 20) {
    throw new AppError(
      'Provide either a valid PDF/TXT/Markdown file or note_text (min 20 characters)',
      400,
    )
  }

  const interaction = await AIInteraction.create({
    user_id: toObjectId(userId, 'userId'),
    interaction_type: 'qa',
    source_type: 'private_upload',
    private_source_title: input.title,
    private_file_url: file ? `private://memory/${file.originalname}` : undefined,
  })

  const { chunk_count } = await indexPrivateNoteText(
    userId,
    interaction._id.toString(),
    input.title,
    extractedText,
  )

  return {
    interaction_id: interaction._id.toString(),
    title: input.title,
    visibility: 'private',
    chunk_count,
  }
}

export const indexApprovedResourceForRag = async (
  resourceId: string,
  noteText?: string,
) => {
  const rid = toObjectId(resourceId, 'resourceId')
  const resource = await Resource.findOne({
    _id: rid,
    approval_status: 'approved',
  })
  if (!resource) {
    throw new AppError('Approved resource not found', 404)
  }

  let textToIndex = noteText?.trim() ?? ''
  if (!textToIndex && resource.file_url.startsWith('/uploads/resources/')) {
    const filePath = path.resolve(
      process.cwd(),
      resource.file_url.replace(/^\//, ''),
    )
    const buffer = await fs.readFile(filePath).catch(() => null)
    if (buffer && resource.mime_type) {
      textToIndex = await extractTextFromBuffer(buffer, resource.mime_type)
    }
  }

  if (!textToIndex) {
    throw new AppError(
      'Provide note_text or upload a readable PDF resource to index for RAG',
      400,
    )
  }

  return indexApprovedResourceText(resourceId, textToIndex)
}

export const executeAiTask = async (params: {
  userId: string
  interactionType: AIInteractionType
  systemInstruction: string
  prompt: string
  resourceId?: string
  interactionId?: string
  retrievalQuery?: string
  requireGroundedContext?: boolean
}) => {
  const uid = toObjectId(params.userId, 'userId')
  let sourceType: 'approved_resource' | 'private_upload' | 'course_topic' =
    'course_topic'
  let targetInteractionId = params.interactionId

  if (params.interactionId) {
    const existing = await AIInteraction.findOne({
      _id: toObjectId(params.interactionId, 'interaction_id'),
      user_id: uid,
    })
    if (!existing) {
      throw new AppError('Private AI note interaction not found', 404)
    }
    sourceType = 'private_upload'
  } else if (params.resourceId) {
    const approved = await Resource.exists({
      _id: toObjectId(params.resourceId, 'resource_id'),
      approval_status: 'approved',
    })
    if (!approved) {
      throw new AppError('Approved resource not found', 404)
    }
    sourceType = 'approved_resource'
  }

  const chunks = await retrieveRelevantChunks({
    userId: params.userId,
    query: params.retrievalQuery ?? params.prompt,
    resourceId: params.resourceId,
    interactionId: params.interactionId,
    limit: 6,
  })

  if (params.requireGroundedContext && chunks.length === 0) {
    throw new AppError(
      'No indexed note content found for this source. Index the resource or upload a private note first.',
      400,
    )
  }

  const { citations, contextText } = buildContextAndCitations(chunks)
  const fullPrompt = contextText
    ? `Context from study materials:\n${contextText}\n\nUser request:\n${params.prompt}`
    : params.prompt

  const generatedResponse = await generateAiText(
    params.systemInstruction,
    fullPrompt,
  )

  if (!targetInteractionId) {
    const interaction = await AIInteraction.create({
      user_id: uid,
      resource_id: params.resourceId
        ? toObjectId(params.resourceId, 'resource_id')
        : undefined,
      interaction_type: params.interactionType,
      source_type: sourceType,
    })
    targetInteractionId = interaction._id.toString()
  }

  const output = await AIOutput.create({
    interaction_id: toObjectId(targetInteractionId, 'interaction_id'),
    prompt: params.prompt,
    generated_response: generatedResponse,
    output_type: params.interactionType,
    citations,
  })

  return {
    interaction_id: targetInteractionId,
    output,
    citations,
  }
}

export const askQuestion = (userId: string, input: AiPromptInput) => {
  return executeAiTask({
    userId,
    interactionType: 'qa',
    systemInstruction:
      'You are Skill Bridge AI Study Assistant. Answer accurately using the provided study context and cite your sources clearly. If context is insufficient, state what is missing.',
    prompt: input.prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    requireGroundedContext: Boolean(input.resource_id || input.interaction_id),
  })
}

export const generateSummary = (userId: string, input: AiPromptInput) => {
  return executeAiTask({
    userId,
    interactionType: 'summary',
    systemInstruction:
      'Summarize the provided study notes clearly with key takeaways and easy-to-understand explanations for university students.',
    prompt: input.prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    requireGroundedContext: Boolean(input.resource_id || input.interaction_id),
  })
}

export const generateQuiz = (userId: string, input: AiQuizInput) => {
  const prompt = `Generate ${input.num_questions} ${input.difficulty}-difficulty multiple-choice questions (MCQs) with 4 options (A-D), the correct answer, and a short explanation.${input.topic ? ` Focus topic: ${input.topic}.` : ''}`

  return executeAiTask({
    userId,
    interactionType: 'quiz',
    systemInstruction:
      'You are an academic assessment generator. Create clear, accurate MCQs grounded in the provided course notes.',
    prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    retrievalQuery: input.topic ?? 'key concepts definitions formulas',
    requireGroundedContext: Boolean(input.resource_id || input.interaction_id),
  })
}

export const listMyAiHistory = async (userId: string) => {
  const uid = toObjectId(userId, 'userId')
  const interactions = await AIInteraction.find({ user_id: uid })
    .populate('resource_id', 'title resource_type')
    .sort({ created_at: -1 })
    .limit(50)

  return interactions
}

export const getAiInteractionDetails = async (
  interactionId: string,
  userId: string,
) => {
  const iid = toObjectId(interactionId, 'interactionId')
  const interaction = await AIInteraction.findOne({
    _id: iid,
    user_id: toObjectId(userId, 'userId'),
  }).populate('resource_id', 'title resource_type')

  if (!interaction) {
    throw new AppError('AI interaction not found', 404)
  }

  const [outputs, chunkCount] = await Promise.all([
    AIOutput.find({ interaction_id: iid }).sort({ created_at: 1 }),
    NoteChunk.countDocuments({ interaction_id: iid, owner_id: interaction.user_id }),
  ])

  return { interaction, outputs, private_chunk_count: chunkCount }
}

export const generateFlashcards = (
  userId: string,
  input: AiStudyDeckInput,
) => {
  const prompt = `Create ${input.count} concise study flashcards (Front: question/term, Back: clear answer/definition) from the notes.${input.topic ? ` Focus on: ${input.topic}.` : ''}`
  return executeAiTask({
    userId,
    interactionType: 'flashcards',
    systemInstruction:
      'Generate clear, high-yield study flashcards grounded in the provided academic notes.',
    prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    retrievalQuery: input.topic ?? 'definitions concepts formulas examples',
    requireGroundedContext: Boolean(input.resource_id || input.interaction_id),
  })
}

export const generateVivaQuestions = (
  userId: string,
  input: AiStudyDeckInput,
) => {
  const prompt = `Generate ${input.count} oral/viva examination questions with concise model answers.${input.topic ? ` Topic: ${input.topic}.` : ''}`
  return executeAiTask({
    userId,
    interactionType: 'viva',
    systemInstruction:
      'Generate university-level viva voce questions and model answers grounded in the provided notes.',
    prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    retrievalQuery: input.topic ?? 'core concepts why how comparisons',
    requireGroundedContext: Boolean(input.resource_id || input.interaction_id),
  })
}

export const suggestExamTopics = async (
  userId: string,
  input: AiNoteAnalysisInput,
) => {
  const prompt = `Identify the most important topics and likely focus areas for exam revision.${input.topic ? ` Course/topic hint: ${input.topic}.` : ''}`
  const result = await executeAiTask({
    userId,
    interactionType: 'exam_topics',
    systemInstruction:
      'Analyze the provided study material to highlight high-priority revision topics. Explicitly remind the student that these suggestions are advisory study guidance and not guaranteed exam content.',
    prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    retrievalQuery: input.topic ?? 'main chapters theorems definitions',
    requireGroundedContext: Boolean(input.resource_id || input.interaction_id),
  })

  return {
    ...result,
    advisory_notice:
      'AI-generated exam-topic suggestions are advisory study aids and are not guaranteed examination content.',
  }
}

export const checkNotesForGaps = (
  userId: string,
  input: AiNoteAnalysisInput,
) => {
  const prompt = `Review the provided notes and highlight unclear explanations, missing steps/gaps, and potential conceptual or factual mistakes.${input.topic ? ` Focus area: ${input.topic}.` : ''}`
  return executeAiTask({
    userId,
    interactionType: 'note_check',
    systemInstruction:
      'Carefully audit the student notes for unclear sections, missing prerequisites, and possible errors, providing constructive corrections.',
    prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    retrievalQuery: input.topic ?? 'explanations proofs steps definitions',
    requireGroundedContext: Boolean(input.resource_id || input.interaction_id),
  })
}

export const generateLectureSlides = (
  userId: string,
  input: AiGenerateSlidesInput,
) => {
  const prompt = `Generate a ${input.slide_count}-slide lecture outline on "${input.topic}" tailored for an ${input.audience_level} university audience. Include slide titles, bullet points, and speaker notes.`
  return executeAiTask({
    userId,
    interactionType: 'slides',
    systemInstruction:
      'You are a university teaching assistant. Create structured, clear lecture slides with concise bullet points and speaker notes.',
    prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    retrievalQuery: input.topic,
  })
}

export const generateExamQuestions = (
  userId: string,
  input: AiExamQuestionsInput,
) => {
  const prompt = `Create ${input.exam_type} exam questions on "${input.topic}" totaling ${input.total_marks} marks, including mark distribution and a grading rubric.${input.preferences ? ` Preferences: ${input.preferences}` : ''}`
  return executeAiTask({
    userId,
    interactionType: 'exam_questions',
    systemInstruction:
      'You are an academic assessment assistant for university faculty. Produce well-balanced exam questions with clear mark allocations and answer guidelines.',
    prompt,
    resourceId: input.resource_id,
    interactionId: input.interaction_id,
    retrievalQuery: input.topic,
  })
}

export const updateAiOutput = async (
  outputId: string,
  userId: string,
  input: UpdateAiOutputInput,
) => {
  const output = await AIOutput.findById(toObjectId(outputId, 'outputId'))
  if (!output) {
    throw new AppError('AI output not found', 404)
  }

  const interaction = await AIInteraction.findOne({
    _id: output.interaction_id,
    user_id: toObjectId(userId, 'userId'),
  })
  if (!interaction) {
    throw new AppError('You are not authorized to edit this AI output', 403)
  }

  output.generated_response = input.generated_response
  await output.save()
  return output
}
