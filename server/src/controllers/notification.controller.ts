import { Request, Response } from 'express'
import * as notificationService from '../services/notification.service'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const requireUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication required', 401)
  return req.user.userId
}

export const listNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const unreadOnly = req.query.unread === 'true'
    const data = await notificationService.listMyNotifications(
      requireUserId(req),
      unreadOnly,
    )
    res.status(200).json({ success: true, data })
  },
)

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markNotificationRead(
    req.params.notificationId,
    requireUserId(req),
  )
  res.status(200).json({ success: true, data: { notification } })
})

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAllNotificationsRead(
    requireUserId(req),
  )
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: result,
  })
})
