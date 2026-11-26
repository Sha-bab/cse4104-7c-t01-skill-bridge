import { Conversation, Message, User } from '../models'
import {
  CreateConversationInput,
  SendMessageInput,
} from '../types/phase4.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

export const getOrCreateConversation = async (
  currentUserId: string,
  input: CreateConversationInput,
) => {
  if (currentUserId === input.participant_id) {
    throw new AppError('You cannot start a conversation with yourself', 400)
  }

  const currentOid = toObjectId(currentUserId, 'currentUserId')
  const partnerOid = toObjectId(input.participant_id, 'participant_id')

  const partnerExists = await User.exists({
    _id: partnerOid,
    account_status: 'active',
  })
  if (!partnerExists) {
    throw new AppError('Participant user not found', 404)
  }

  const existing = await Conversation.findOne({
    participants: { $all: [currentOid, partnerOid], $size: 2 },
    conversation_type: input.conversation_type,
  }).populate('participants', 'name role')

  if (existing) {
    return existing
  }

  const created = await Conversation.create({
    participants: [currentOid, partnerOid],
    conversation_type: input.conversation_type,
  })

  return created.populate('participants', 'name role')
}

export const listMyConversations = async (userId: string) => {
  return Conversation.find({
    participants: toObjectId(userId, 'userId'),
  })
    .populate('participants', 'name role')
    .sort({ last_message_at: -1, updated_at: -1 })
}

const assertConversationParticipant = async (
  conversationId: string,
  userId: string,
) => {
  const cid = toObjectId(conversationId, 'conversationId')
  const conversation = await Conversation.findById(cid)
  if (!conversation) {
    throw new AppError('Conversation not found', 404)
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId,
  )
  if (!isParticipant) {
    throw new AppError(
      'You are not authorized to access this conversation',
      403,
    )
  }

  return conversation
}

export const getConversationMessages = async (
  conversationId: string,
  userId: string,
) => {
  await assertConversationParticipant(conversationId, userId)

  return Message.find({
    conversation_id: toObjectId(conversationId, 'conversationId'),
  })
    .populate('sender_id', 'name role')
    .sort({ created_at: 1 })
    .limit(200)
}

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  input: SendMessageInput,
) => {
  const conversation = await assertConversationParticipant(
    conversationId,
    senderId,
  )

  const message = await Message.create({
    conversation_id: conversation._id,
    sender_id: toObjectId(senderId, 'senderId'),
    message_text: input.message_text,
  })

  conversation.last_message_at = new Date()
  await conversation.save()

  return message.populate('sender_id', 'name role')
}
