import { ClassSeminar, ResearchInterest } from '../models'
import {
  CreateClassSeminarInput,
  UpdateResearchInterestStatusInput,
} from '../types/phase6.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

export const createClassSeminar = async (
  facultyId: string,
  input: CreateClassSeminarInput,
) => {
  return ClassSeminar.create({
    faculty_id: toObjectId(facultyId, 'facultyId'),
    title: input.title,
    event_type: input.event_type,
    scheduled_at: input.scheduled_at,
    meeting_link: input.meeting_link,
  })
}

export const listClassSeminars = async (eventType?: string) => {
  const query: Record<string, unknown> = {}
  if (eventType) query.event_type = eventType

  return ClassSeminar.find(query)
    .populate('faculty_id', 'name role')
    .sort({ scheduled_at: 1 })
    .limit(100)
}

export const listFacultyResearchInterests = async (facultyId: string) => {
  return ResearchInterest.find({
    faculty_id: toObjectId(facultyId, 'facultyId'),
  })
    .populate('post_id', 'content created_at')
    .populate('student_id', 'name email role')
    .sort({ created_at: -1 })
}

export const updateResearchInterestStatus = async (
  interestId: string,
  facultyId: string,
  input: UpdateResearchInterestStatusInput,
) => {
  const updated = await ResearchInterest.findOneAndUpdate(
    {
      _id: toObjectId(interestId, 'interestId'),
      faculty_id: toObjectId(facultyId, 'facultyId'),
    },
    { $set: { status: input.status } },
    { new: true, runValidators: true },
  )

  if (!updated) {
    throw new AppError('Research interest record not found', 404)
  }

  return updated
}
