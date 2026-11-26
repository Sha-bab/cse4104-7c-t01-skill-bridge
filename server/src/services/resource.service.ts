import {
  Course,
  Resource,
  ResourceInteraction,
  ResourceReview,
  User,
} from '../models'
import {
  CreateResourceInput,
  CreateResourceReviewInput,
  ResourceInteractionInput,
  ReviewResourceApprovalInput,
} from '../types/phase3.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'
import { createNotification } from './notification.service'

export const createResource = async (
  uploaderId: string,
  input: CreateResourceInput,
  uploadedFile?: Express.Multer.File,
) => {
  const courseId = toObjectId(input.course_id, 'course_id')
  const courseExists = await Course.exists({ _id: courseId })
  if (!courseExists) {
    throw new AppError('Course not found', 404)
  }

  if (input.faculty_id) {
    const facultyExists = await User.exists({
      _id: toObjectId(input.faculty_id, 'faculty_id'),
      role: 'faculty',
    })
    if (!facultyExists) {
      throw new AppError('Referenced faculty user not found', 404)
    }
  }

  const fileUrl = uploadedFile
    ? `/uploads/resources/${uploadedFile.filename}`
    : input.file_url

  if (!fileUrl) {
    throw new AppError(
      'Either a file upload or a valid file_url is required',
      400,
    )
  }

  return Resource.create({
    uploader_id: toObjectId(uploaderId, 'uploader_id'),
    course_id: courseId,
    faculty_id: input.faculty_id
      ? toObjectId(input.faculty_id, 'faculty_id')
      : undefined,
    title: input.title,
    description: input.description,
    file_url: fileUrl,
    resource_type: input.resource_type,
    mime_type: uploadedFile?.mimetype,
    file_size: uploadedFile?.size,
    semester: input.semester,
    section: input.section,
    approval_status: 'pending',
  })
}

export const listApprovedResources = async (filters: {
  course_id?: string
  faculty_id?: string
  semester?: string
  section?: string
  resource_type?: string
  q?: string
}) => {
  // Security rule: Only approved resources may appear in the public library
  const query: Record<string, unknown> = { approval_status: 'approved' }

  if (filters.course_id) {
    query.course_id = toObjectId(filters.course_id, 'course_id')
  }
  if (filters.faculty_id) {
    query.faculty_id = toObjectId(filters.faculty_id, 'faculty_id')
  }
  if (filters.semester) query.semester = filters.semester.trim()
  if (filters.section) query.section = filters.section.trim()
  if (filters.resource_type) query.resource_type = filters.resource_type.trim()
  if (filters.q && filters.q.trim()) {
    const regex = new RegExp(filters.q.trim(), 'i')
    query.$or = [{ title: regex }, { description: regex }]
  }

  return Resource.find(query)
    .populate('uploader_id', 'name role')
    .populate('course_id', 'course_code course_name semester')
    .populate('faculty_id', 'name')
    .sort({ created_at: -1 })
    .limit(100)
}

export const listMyResources = async (uploaderId: string) => {
  return Resource.find({ uploader_id: toObjectId(uploaderId, 'uploader_id') })
    .populate('course_id', 'course_code course_name')
    .sort({ created_at: -1 })
}

export const listPendingResources = async () => {
  return Resource.find({ approval_status: 'pending' })
    .populate('uploader_id', 'name role')
    .populate('course_id', 'course_code course_name')
    .sort({ created_at: 1 })
}

export const getResourceById = async (
  resourceId: string,
  viewerId: string,
  viewerRole: string,
) => {
  const resource = await Resource.findById(toObjectId(resourceId, 'resourceId'))
    .populate('uploader_id', 'name role')
    .populate('course_id', 'course_code course_name semester')
    .populate('faculty_id', 'name')

  if (!resource) {
    throw new AppError('Resource not found', 404)
  }

  const isOwner = resource.uploader_id._id.toString() === viewerId
  const isStaff = viewerRole === 'admin' || viewerRole === 'moderator'

  if (resource.approval_status !== 'approved' && !isOwner && !isStaff) {
    throw new AppError('Resource is not publicly available', 403)
  }

  return resource
}

export const reviewResourceApproval = async (
  resourceId: string,
  reviewerId: string,
  input: ReviewResourceApprovalInput,
) => {
  const resource = await Resource.findById(toObjectId(resourceId, 'resourceId'))
  if (!resource) {
    throw new AppError('Resource not found', 404)
  }

  resource.approval_status = input.approval_status
  resource.reviewed_by = toObjectId(reviewerId, 'reviewerId')
  resource.reviewed_at = new Date()
  resource.rejection_reason =
    input.approval_status === 'rejected' ? input.rejection_reason : undefined

  await resource.save()

  const statusMessage =
    input.approval_status === 'approved'
      ? `Your resource "${resource.title}" was approved and published.`
      : `Your resource "${resource.title}" was rejected. Reason: ${input.rejection_reason ?? 'Not specified'}`

  await createNotification({
    recipientId: resource.uploader_id.toString(),
    senderId: reviewerId,
    relatedId: resource._id.toString(),
    relatedType: 'resource',
    notificationType: `resource_${input.approval_status}`,
    message: statusMessage,
  })

  return resource
}

export const recordInteraction = async (
  resourceId: string,
  userId: string,
  input: ResourceInteractionInput,
) => {
  const rid = toObjectId(resourceId, 'resourceId')
  const resource = await Resource.findOne({
    _id: rid,
    approval_status: 'approved',
  })
  if (!resource) {
    throw new AppError('Approved resource not found', 404)
  }

  await ResourceInteraction.create({
    resource_id: rid,
    user_id: toObjectId(userId, 'userId'),
    interaction_type: input.interaction_type,
  })

  const incField =
    input.interaction_type === 'download'
      ? { download_count: 1 }
      : { view_count: 1 }

  const updated = await Resource.findByIdAndUpdate(
    rid,
    { $inc: incField },
    { new: true },
  )

  return updated
}

export const getResourceStats = async (
  resourceId: string,
  requesterId: string,
  requesterRole: string,
) => {
  const rid = toObjectId(resourceId, 'resourceId')
  const resource = await Resource.findById(rid)
  if (!resource) {
    throw new AppError('Resource not found', 404)
  }

  const isOwner = resource.uploader_id.toString() === requesterId
  const isStaff =
    requesterRole === 'admin' ||
    requesterRole === 'moderator' ||
    requesterRole === 'faculty'

  if (!isOwner && !isStaff) {
    throw new AppError('Not authorized to view resource analytics', 403)
  }

  const breakdown = await ResourceInteraction.aggregate([
    { $match: { resource_id: rid } },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: {
          interaction_type: '$interaction_type',
          role: '$user.role',
        },
        count: { $sum: 1 },
      },
    },
  ])

  return {
    resource_id: resource._id.toString(),
    view_count: resource.view_count,
    download_count: resource.download_count,
    star_count: resource.star_count,
    review_count: resource.review_count,
    average_rating: resource.average_rating,
    role_breakdown: breakdown,
  }
}

export const upsertResourceReview = async (
  resourceId: string,
  reviewerId: string,
  input: CreateResourceReviewInput,
) => {
  const rid = toObjectId(resourceId, 'resourceId')
  const uid = toObjectId(reviewerId, 'reviewerId')

  const resource = await Resource.findOne({
    _id: rid,
    approval_status: 'approved',
  })
  if (!resource) {
    throw new AppError('Only approved resources can be reviewed', 400)
  }

  const review = await ResourceReview.findOneAndUpdate(
    { resource_id: rid, reviewer_id: uid },
    {
      $set: {
        star_value: input.star_value,
        review_text: input.review_text,
      },
    },
    { new: true, upsert: true, runValidators: true },
  )

  const [agg] = await ResourceReview.aggregate([
    { $match: { resource_id: rid } },
    {
      $group: {
        _id: '$resource_id',
        review_count: { $sum: 1 },
        average_rating: { $avg: '$star_value' },
      },
    },
  ])

  await Resource.findByIdAndUpdate(rid, {
    $set: {
      review_count: agg ? agg.review_count : 0,
      average_rating: agg ? Number(agg.average_rating.toFixed(2)) : 0,
    },
  })

  return review
}

export const listResourceReviews = async (resourceId: string) => {
  return ResourceReview.find({
    resource_id: toObjectId(resourceId, 'resourceId'),
  })
    .populate('reviewer_id', 'name role')
    .sort({ created_at: -1 })
}
