import { Notification, NotificationRelatedType } from '../models'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

export const createNotification = async (params: {
  recipientId: string
  senderId?: string
  relatedId?: string
  relatedType?: NotificationRelatedType
  notificationType: string
  message: string
}) => {
  return Notification.create({
    recipient_id: toObjectId(params.recipientId, 'recipientId'),
    sender_id: params.senderId
      ? toObjectId(params.senderId, 'senderId')
      : undefined,
    related_id: params.relatedId
      ? toObjectId(params.relatedId, 'relatedId')
      : undefined,
    related_type: params.relatedType ?? 'system',
    notification_type: params.notificationType,
    message: params.message,
    is_read: false,
  })
}

export const listMyNotifications = async (
  userId: string,
  unreadOnly = false,
) => {
  const uid = toObjectId(userId, 'userId')
  const query: Record<string, unknown> = { recipient_id: uid }
  if (unreadOnly) {
    query.is_read = false
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('sender_id', 'name role')
      .sort({ created_at: -1 })
      .limit(50),
    Notification.countDocuments({ recipient_id: uid, is_read: false }),
  ])

  return { notifications, unread_count: unreadCount }
}

export const markNotificationRead = async (
  notificationId: string,
  userId: string,
) => {
  const updated = await Notification.findOneAndUpdate(
    {
      _id: toObjectId(notificationId, 'notificationId'),
      recipient_id: toObjectId(userId, 'userId'),
    },
    { $set: { is_read: true } },
    { new: true },
  )

  if (!updated) {
    throw new AppError('Notification not found', 404)
  }

  return updated
}

export const markAllNotificationsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { recipient_id: toObjectId(userId, 'userId'), is_read: false },
    { $set: { is_read: true } },
  )
  return { modified_count: result.modifiedCount }
}
