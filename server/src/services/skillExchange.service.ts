import {
  Session,
  SessionReview,
  Skill,
  SkillRequest,
  User,
  Volunteer,
} from '../models'
import {
  CreateSessionInput,
  CreateSessionReviewInput,
  CreateSkillRequestInput,
  RespondDirectRequestInput,
  SelectMentorInput,
  UpdateSessionStatusInput,
} from '../types/phase4.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

export const createSkillRequest = async (
  learnerId: string,
  input: CreateSkillRequestInput,
) => {
  const skillId = toObjectId(input.skill_id, 'skill_id')
  const skillExists = await Skill.exists({ _id: skillId })
  if (!skillExists) {
    throw new AppError('Skill not found', 404)
  }

  let recipientOid
  if (input.request_type === 'direct') {
    if (!input.recipient_id) {
      throw new AppError('recipient_id is required for direct requests', 400)
    }
    if (input.recipient_id === learnerId) {
      throw new AppError('You cannot send a skill request to yourself', 400)
    }
    recipientOid = toObjectId(input.recipient_id, 'recipient_id')
    const recipientActive = await User.exists({
      _id: recipientOid,
      account_status: 'active',
    })
    if (!recipientActive) {
      throw new AppError('Recipient user not found', 404)
    }
  }

  return SkillRequest.create({
    learner_id: toObjectId(learnerId, 'learner_id'),
    skill_id: skillId,
    recipient_id: recipientOid,
    request_type: input.request_type,
    topic_description: input.topic_description,
    status: 'open',
  })
}

export const listPublicOpenRequests = async (skillId?: string) => {
  const query: Record<string, unknown> = {
    request_type: 'public',
    status: 'open',
  }
  if (skillId) {
    query.skill_id = toObjectId(skillId, 'skill_id')
  }

  return SkillRequest.find(query)
    .populate('learner_id', 'name role')
    .populate('skill_id', 'skill_name category')
    .sort({ created_at: -1 })
    .limit(100)
}

export const listMySkillRequests = async (userId: string) => {
  const uid = toObjectId(userId, 'userId')
  return SkillRequest.find({
    $or: [
      { learner_id: uid },
      { recipient_id: uid },
      { selected_mentor_id: uid },
    ],
  })
    .populate('learner_id', 'name role')
    .populate('recipient_id', 'name role')
    .populate('selected_mentor_id', 'name role')
    .populate('skill_id', 'skill_name category')
    .sort({ created_at: -1 })
}

export const respondToDirectRequest = async (
  requestId: string,
  recipientId: string,
  input: RespondDirectRequestInput,
) => {
  const reqDoc = await SkillRequest.findById(toObjectId(requestId, 'requestId'))
  if (!reqDoc) {
    throw new AppError('Skill request not found', 404)
  }
  if (reqDoc.request_type !== 'direct') {
    throw new AppError('Only direct requests can be accepted or declined', 400)
  }
  if (reqDoc.recipient_id?.toString() !== recipientId) {
    throw new AppError('Only the request recipient can respond', 403)
  }
  if (reqDoc.status !== 'open') {
    throw new AppError('This request has already been processed', 400)
  }

  if (input.action === 'accept') {
    reqDoc.status = 'accepted'
    reqDoc.selected_mentor_id = toObjectId(recipientId, 'recipientId')
  } else {
    reqDoc.status = 'declined'
  }

  await reqDoc.save()
  return reqDoc
}

export const volunteerForPublicRequest = async (
  requestId: string,
  volunteerId: string,
) => {
  const reqId = toObjectId(requestId, 'requestId')
  const volId = toObjectId(volunteerId, 'volunteerId')

  const reqDoc = await SkillRequest.findById(reqId)
  if (!reqDoc) {
    throw new AppError('Skill request not found', 404)
  }
  if (reqDoc.request_type !== 'public' || reqDoc.status !== 'open') {
    throw new AppError('You can only volunteer for open public requests', 400)
  }
  if (reqDoc.learner_id.toString() === volunteerId) {
    throw new AppError('You cannot volunteer for your own request', 400)
  }

  return Volunteer.findOneAndUpdate(
    { request_id: reqId, volunteer_id: volId },
    { $setOnInsert: { request_id: reqId, volunteer_id: volId, status: 'pending' } },
    { new: true, upsert: true },
  )
}

export const listVolunteersForRequest = async (
  requestId: string,
  requesterId: string,
) => {
  const reqId = toObjectId(requestId, 'requestId')
  const reqDoc = await SkillRequest.findById(reqId)
  if (!reqDoc) {
    throw new AppError('Skill request not found', 404)
  }
  if (reqDoc.learner_id.toString() !== requesterId) {
    throw new AppError('Only the learner can view request volunteers', 403)
  }

  return Volunteer.find({ request_id: reqId })
    .populate('volunteer_id', 'name role verification_status')
    .sort({ created_at: 1 })
}

export const selectMentorForRequest = async (
  requestId: string,
  learnerId: string,
  input: SelectMentorInput,
) => {
  const reqId = toObjectId(requestId, 'requestId')
  const mentorOid = toObjectId(input.mentor_id, 'mentor_id')

  const reqDoc = await SkillRequest.findById(reqId)
  if (!reqDoc) {
    throw new AppError('Skill request not found', 404)
  }
  if (reqDoc.learner_id.toString() !== learnerId) {
    throw new AppError('Only the learner can select a mentor', 403)
  }
  if (reqDoc.request_type !== 'public' || reqDoc.status !== 'open') {
    throw new AppError('Mentor selection is only valid for open public requests', 400)
  }

  const volunteer = await Volunteer.findOne({
    request_id: reqId,
    volunteer_id: mentorOid,
    status: 'pending',
  })
  if (!volunteer) {
    throw new AppError('Selected user has not volunteered for this request', 404)
  }

  await Volunteer.updateMany(
    { request_id: reqId, volunteer_id: { $ne: mentorOid } },
    { $set: { status: 'declined' } },
  )
  volunteer.status = 'selected'
  await volunteer.save()

  reqDoc.selected_mentor_id = mentorOid
  reqDoc.status = 'mentor_selected'
  await reqDoc.save()

  return reqDoc
}

export const createSession = async (
  userId: string,
  input: CreateSessionInput,
) => {
  const reqId = toObjectId(input.request_id, 'request_id')
  const reqDoc = await SkillRequest.findById(reqId)
  if (!reqDoc) {
    throw new AppError('Skill request not found', 404)
  }

  if (
    !reqDoc.selected_mentor_id ||
    !['accepted', 'mentor_selected'].includes(reqDoc.status)
  ) {
    throw new AppError(
      'A mentor must be accepted or selected before scheduling a session',
      400,
    )
  }

  const isParticipant =
    reqDoc.learner_id.toString() === userId ||
    reqDoc.selected_mentor_id.toString() === userId

  if (!isParticipant) {
    throw new AppError('Only the learner or mentor can schedule a session', 403)
  }

  return Session.create({
    request_id: reqId,
    learner_id: reqDoc.learner_id,
    mentor_id: reqDoc.selected_mentor_id,
    session_mode: input.session_mode,
    scheduled_at: input.scheduled_at,
    meeting_link: input.meeting_link,
    status: 'scheduled',
  })
}

export const listMySessions = async (userId: string) => {
  const uid = toObjectId(userId, 'userId')
  return Session.find({
    $or: [{ learner_id: uid }, { mentor_id: uid }],
  })
    .populate('learner_id', 'name role')
    .populate('mentor_id', 'name role')
    .populate('request_id', 'skill_id topic_description status')
    .sort({ scheduled_at: -1 })
}

export const updateSessionStatus = async (
  sessionId: string,
  userId: string,
  input: UpdateSessionStatusInput,
) => {
  const session = await Session.findById(toObjectId(sessionId, 'sessionId'))
  if (!session) {
    throw new AppError('Session not found', 404)
  }

  const isParticipant =
    session.learner_id.toString() === userId ||
    session.mentor_id.toString() === userId
  if (!isParticipant) {
    throw new AppError('Not authorized to update this session', 403)
  }

  if (session.status !== 'scheduled') {
    throw new AppError(`Session is already ${session.status}`, 400)
  }

  session.status = input.status
  await session.save()

  if (input.status === 'completed') {
    await SkillRequest.findByIdAndUpdate(session.request_id, {
      $set: { status: 'completed' },
    })
  }

  return session
}

export const reviewCompletedSession = async (
  sessionId: string,
  reviewerId: string,
  input: CreateSessionReviewInput,
) => {
  const sid = toObjectId(sessionId, 'sessionId')
  const session = await Session.findById(sid)
  if (!session) {
    throw new AppError('Session not found', 404)
  }

  if (session.learner_id.toString() !== reviewerId) {
    throw new AppError('Only the learner can rate and review the mentor', 403)
  }

  // SRS Constraint: rating only allowed for completed sessions
  if (session.status !== 'completed') {
    throw new AppError('You can only review a completed session', 400)
  }

  return SessionReview.findOneAndUpdate(
    { session_id: sid, reviewer_id: toObjectId(reviewerId, 'reviewerId') },
    {
      $set: {
        mentor_id: session.mentor_id,
        rating: input.rating,
        review_text: input.review_text,
      },
    },
    { new: true, upsert: true, runValidators: true },
  )
}

export const getMentorReviews = async (mentorId: string) => {
  const mid = toObjectId(mentorId, 'mentorId')
  const reviews = await SessionReview.find({ mentor_id: mid })
    .populate('reviewer_id', 'name role')
    .sort({ created_at: -1 })

  const avg =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          ).toFixed(2),
        )
      : 0

  return {
    mentor_id: mentorId,
    review_count: reviews.length,
    average_rating: avg,
    reviews,
  }
}

export const adminGetSkillExchangeHistory = async () => {
  const [sessions, reviews] = await Promise.all([
    Session.find()
      .populate('learner_id', 'name role')
      .populate('mentor_id', 'name role')
      .sort({ created_at: -1 })
      .limit(100),
    SessionReview.find()
      .populate('reviewer_id', 'name role')
      .populate('mentor_id', 'name role')
      .sort({ created_at: -1 })
      .limit(100),
  ])

  return { sessions, reviews }
}
