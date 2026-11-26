import mongoose from 'mongoose'
import { FeedPost, Resource, Star } from '../models'
import { ToggleStarInput } from '../types/phase3.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

const resolveStarRecipient = async (
  targetId: mongoose.Types.ObjectId,
  targetType: ToggleStarInput['target_type'],
): Promise<mongoose.Types.ObjectId> => {
  if (targetType === 'resource') {
    const resource = await Resource.findOne({
      _id: targetId,
      approval_status: 'approved',
    }).select('uploader_id')
    if (!resource) {
      throw new AppError('Approved resource not found', 404)
    }
    return resource.uploader_id
  }

  const post = await FeedPost.findById(targetId).select('author_id')
  if (!post) {
    throw new AppError('Feed post not found', 404)
  }
  return post.author_id
}

export const toggleStar = async (giverId: string, input: ToggleStarInput) => {
  const giverOid = toObjectId(giverId, 'giverId')
  const targetOid = toObjectId(input.target_id, 'target_id')

  const recipientOid = await resolveStarRecipient(targetOid, input.target_type)
  if (recipientOid.toString() === giverId) {
    throw new AppError('You cannot star your own content', 400)
  }

  const existing = await Star.findOneAndDelete({
    giver_id: giverOid,
    target_id: targetOid,
    target_type: input.target_type,
  })

  let starred: boolean
  if (existing) {
    starred = false
    if (input.target_type === 'resource') {
      await Resource.findByIdAndUpdate(targetOid, { $inc: { star_count: -1 } })
    } else {
      await FeedPost.findByIdAndUpdate(targetOid, { $inc: { star_count: -1 } })
    }
  } else {
    await Star.create({
      giver_id: giverOid,
      recipient_id: recipientOid,
      target_id: targetOid,
      target_type: input.target_type,
    })
    starred = true
    if (input.target_type === 'resource') {
      await Resource.findByIdAndUpdate(targetOid, { $inc: { star_count: 1 } })
    } else {
      await FeedPost.findByIdAndUpdate(targetOid, { $inc: { star_count: 1 } })
    }
  }

  const totalOnTarget = await Star.countDocuments({
    target_id: targetOid,
    target_type: input.target_type,
  })

  return { starred, target_stars: totalOnTarget }
}

export const getMyStarSummary = async (userId: string) => {
  const uid = toObjectId(userId, 'userId')
  const [received, given] = await Promise.all([
    Star.countDocuments({ recipient_id: uid }),
    Star.countDocuments({ giver_id: uid }),
  ])
  return { total_stars_received: received, total_stars_given: given }
}

export const getStarLeaderboard = async (limit = 20) => {
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  return Star.aggregate([
    {
      $group: {
        _id: '$recipient_id',
        total_stars: { $sum: 1 },
      },
    },
    { $sort: { total_stars: -1 } },
    { $limit: safeLimit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: { 'user.account_status': 'active' } },
    {
      $project: {
        _id: 0,
        user_id: '$_id',
        name: '$user.name',
        role: '$user.role',
        total_stars: 1,
      },
    },
  ])
}
