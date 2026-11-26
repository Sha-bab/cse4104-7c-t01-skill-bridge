import {
  AccountStatus,
  FeedPost,
  Message,
  ModerationAction,
  Report,
  Resource,
  User,
} from '../models'
import {
  CreateReportInput,
  ModerationActionInput,
} from '../types/phase6.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'
import { createNotification } from './notification.service'

const resolveReportedTargetUser = async (
  targetType: CreateReportInput['target_type'],
  targetId: string,
): Promise<string | null> => {
  const tid = toObjectId(targetId, 'target_id')

  if (targetType === 'user') {
    const exists = await User.exists({ _id: tid })
    return exists ? tid.toString() : null
  }
  if (targetType === 'resource') {
    const doc = await Resource.findById(tid).select('uploader_id')
    return doc ? doc.uploader_id.toString() : null
  }
  if (targetType === 'feed_post') {
    const doc = await FeedPost.findById(tid).select('author_id')
    return doc ? doc.author_id.toString() : null
  }
  if (targetType === 'message') {
    const doc = await Message.findById(tid).select('sender_id')
    return doc ? doc.sender_id.toString() : null
  }
  return null
}

export const createReport = async (
  reporterId: string,
  input: CreateReportInput,
  evidenceFile?: Express.Multer.File,
) => {
  const targetOwner = await resolveReportedTargetUser(
    input.target_type,
    input.target_id,
  )
  if (!targetOwner) {
    throw new AppError('Reported target does not exist', 404)
  }

  const evidenceUrl = evidenceFile
    ? `/uploads/evidence/${evidenceFile.filename}`
    : input.evidence_url

  return Report.create({
    reporter_id: toObjectId(reporterId, 'reporterId'),
    target_id: toObjectId(input.target_id, 'target_id'),
    target_type: input.target_type,
    reason: input.reason,
    evidence_url: evidenceUrl,
    status: 'pending',
  })
}

export const listReportsForModeration = async (status?: string) => {
  const query: Record<string, unknown> = {}
  if (status) query.status = status

  return Report.find(query)
    .populate('reporter_id', 'name role')
    .sort({ created_at: -1 })
    .limit(100)
}

const ACTION_TO_ACCOUNT_STATUS: Partial<
  Record<ModerationActionInput['action_type'], AccountStatus>
> = {
  restrict: 'restricted',
  suspend: 'suspended',
  block: 'blocked',
  restore: 'active',
}

export const takeModerationAction = async (
  reportId: string,
  adminId: string,
  input: ModerationActionInput,
) => {
  const rid = toObjectId(reportId, 'reportId')
  const report = await Report.findById(rid)
  if (!report) {
    throw new AppError('Report not found', 404)
  }

  const targetUserId =
    input.target_user_id ??
    (await resolveReportedTargetUser(
      report.target_type,
      report.target_id.toString(),
    ))

  if (!targetUserId) {
    throw new AppError('Could not determine target user for moderation', 400)
  }

  const action = await ModerationAction.create({
    report_id: rid,
    admin_id: toObjectId(adminId, 'adminId'),
    target_user_id: toObjectId(targetUserId, 'target_user_id'),
    action_type: input.action_type,
    reason: input.reason,
  })

  report.status = input.action_type === 'dismiss' ? 'dismissed' : 'action_taken'
  await report.save()

  const nextAccountStatus = ACTION_TO_ACCOUNT_STATUS[input.action_type]
  if (nextAccountStatus) {
    await User.findByIdAndUpdate(toObjectId(targetUserId, 'target_user_id'), {
      $set: {
        account_status: nextAccountStatus,
        restriction_reason:
          nextAccountStatus === 'active' ? undefined : input.reason,
      },
      ...(nextAccountStatus !== 'active'
        ? { $unset: { refresh_token_hash: 1 } }
        : {}),
    })
  }

  if (input.action_type !== 'dismiss') {
    await createNotification({
      recipientId: targetUserId,
      senderId: adminId,
      relatedId: action._id.toString(),
      relatedType: 'moderation',
      notificationType: `moderation_${input.action_type}`,
      message: `Moderation notice (${input.action_type}): ${input.reason}`,
    })
  }

  return { report, action }
}

export const listModerationActions = async () => {
  return ModerationAction.find()
    .populate('admin_id', 'name role')
    .populate('target_user_id', 'name role account_status')
    .sort({ created_at: -1 })
    .limit(100)
}
