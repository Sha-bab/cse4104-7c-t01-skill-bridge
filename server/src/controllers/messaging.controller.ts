import { Request, Response } from 'express'
import * as messagingService from '../services/messaging.service'
import {
  CreateConversationInput,
  SendMessageInput,
} from '../types/phase4.schema'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user.userId
}

export const getOrCreateConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const conversation = await messagingService.getOrCreateConversation(
      requireUserId(req),
      req.body as CreateConversationInput,
    )
    res.status(200).json({ success: true, data: { conversation } })
  },
)

export const listMyConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const conversations = await messagingService.listMyConversations(
      requireUserId(req),
    )
    res.status(200).json({ success: true, data: { conversations } })
  },
)

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const messages = await messagingService.getConversationMessages(
    req.params.conversationId,
    requireUserId(req),
  )
  res.status(200).json({ success: true, data: { messages } })
})

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagingService.sendMessage(
    req.params.conversationId,
    requireUserId(req),
    req.body as SendMessageInput,
  )
  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: { message },
  })
})
