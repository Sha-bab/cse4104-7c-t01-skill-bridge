import { FeedPost, ResearchInterest, User, UserRole } from '../models'
import {
  CreateFeedPostInput,
  ExpressResearchInterestInput,
} from '../types/phase6.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'
import { createNotification } from './notification.service'

export const createFeedPost = async (
  authorId: string,
  authorRole: UserRole,
  input: CreateFeedPostInput,
) => {
  if (
    input.post_type === 'research_assistance' &&
    authorRole !== 'faculty' &&
    authorRole !== 'admin'
  ) {
    throw new AppError(
      'Only faculty members can publish research assistance posts',
      403,
    )
  }

  return FeedPost.create({
    author_id: toObjectId(authorId, 'authorId'),
    content: input.content,
    post_type: input.post_type,
    visibility: input.visibility,
    attachment_url: input.attachment_url,
    attachment_type: input.attachment_type,
  })
}

export const listFeedPosts = async (filters: {
  post_type?: string
  visibility?: string
  q?: string
}) => {
  const query: Record<string, unknown> = {}
  if (filters.post_type) query.post_type = filters.post_type
  if (filters.visibility) query.visibility = filters.visibility
  if (filters.q && filters.q.trim()) {
    query.content = { $regex: filters.q.trim(), $options: 'i' }
  }

  return FeedPost.find(query)
    .populate('author_id', 'name role verification_status')
    .sort({ created_at: -1 })
    .limit(100)
}

export const expressResearchInterest = async (
  postId: string,
  studentId: string,
  input: ExpressResearchInterestInput,
) => {
  const pid = toObjectId(postId, 'postId')
  const sid = toObjectId(studentId, 'studentId')

  const post = await FeedPost.findById(pid)
  if (!post || post.post_type !== 'research_assistance') {
    throw new AppError('Research assistance post not found', 404)
  }

  const [student, faculty] = await Promise.all([
    User.findById(sid).select('name email'),
    User.findById(post.author_id).select('name email'),
  ])

  if (!student || !faculty) {
    throw new AppError('Associated student or faculty user not found', 404)
  }

  const interest = await ResearchInterest.findOneAndUpdate(
    { post_id: pid, student_id: sid },
    {
      $set: {
        faculty_id: faculty._id,
        proposal_text: input.proposal_text,
      },
      $setOnInsert: { status: 'pending' },
    },
    { new: true, upsert: true, runValidators: true },
  )

  // FR-44: Notify faculty member with interested student's email
  await createNotification({
    recipientId: faculty._id.toString(),
    senderId: student._id.toString(),
    relatedId: interest._id.toString(),
    relatedType: 'research_interest',
    notificationType: 'research_interest_received',
    message: `${student.name} (${student.email}) expressed interest in your research assistance post.`,
  })

  // FR-43: Return faculty contact email to student for proposal submission
  return {
    interest,
    faculty_contact: {
      name: faculty.name,
      email: faculty.email,
    },
  }
}
