import {
  Department,
  FacultyProfile,
  Profile,
  Project,
  Skill,
  User,
  UserSkill,
} from '../models'
import {
  AddUserSkillInput,
  CreateProjectInput,
  UpdateFacultyProfileInput,
  UpdateProjectInput,
  UpdateStudentProfileInput,
} from '../types/phase2.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

const ensureDepartmentExists = async (departmentId?: string): Promise<void> => {
  if (!departmentId) return
  const exists = await Department.exists({ _id: toObjectId(departmentId, 'department_id') })
  if (!exists) {
    throw new AppError('Department not found', 404)
  }
}

const getSkillsAndProjects = async (userId: string) => {
  const uid = toObjectId(userId, 'userId')
  const [skills, projects] = await Promise.all([
    UserSkill.find({ user_id: uid }).populate('skill_id', 'skill_name category'),
    Project.find({ user_id: uid }).sort({ created_at: -1 }),
  ])
  return { skills, projects }
}

export const getMyProfile = async (userId: string) => {
  const user = await User.findById(toObjectId(userId, 'userId'))
  if (!user || user.account_status === 'deleted') {
    throw new AppError('Account not found', 404)
  }

  const [profile, facultyProfile, extras] = await Promise.all([
    Profile.findOne({ user_id: user._id }).populate(
      'department_id',
      'department_name department_code',
    ),
    user.role === 'faculty'
      ? FacultyProfile.findOne({ user_id: user._id }).populate(
          'department_id',
          'department_name department_code',
        )
      : Promise.resolve(null),
    getSkillsAndProjects(userId),
  ])

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      institutional_id: user.institutional_id,
      role: user.role,
      is_email_verified: user.is_email_verified,
      verification_status: user.verification_status,
      account_status: user.account_status,
    },
    profile,
    faculty_profile: facultyProfile,
    skills: extras.skills,
    projects: extras.projects,
  }
}

export const getPublicProfile = async (targetUserId: string) => {
  const uid = toObjectId(targetUserId, 'userId')
  // Explicitly omit email, institutional_id, and secret fields for privacy (NFR-18)
  const user = await User.findOne({
    _id: uid,
    account_status: 'active',
  }).select('name role verification_status created_at')

  if (!user) {
    throw new AppError('User profile not found', 404)
  }

  const [profile, facultyProfile, extras] = await Promise.all([
    Profile.findOne({ user_id: uid }).populate(
      'department_id',
      'department_name department_code',
    ),
    user.role === 'faculty'
      ? FacultyProfile.findOne({ user_id: uid }).populate(
          'department_id',
          'department_name department_code',
        )
      : Promise.resolve(null),
    getSkillsAndProjects(targetUserId),
  ])

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      verification_status: user.verification_status,
    },
    profile,
    faculty_profile: facultyProfile,
    skills: extras.skills,
    projects: extras.projects,
  }
}

export const updateStudentProfile = async (
  userId: string,
  input: UpdateStudentProfileInput,
) => {
  await ensureDepartmentExists(input.department_id)
  const uid = toObjectId(userId, 'userId')

  if (input.name) {
    await User.findByIdAndUpdate(uid, { name: input.name })
  }

  const updateFields: Record<string, unknown> = {}
  if (input.department_id !== undefined) {
    updateFields.department_id = toObjectId(input.department_id, 'department_id')
  }
  if (input.profile_picture !== undefined) updateFields.profile_picture = input.profile_picture
  if (input.bio !== undefined) updateFields.bio = input.bio
  if (input.semester !== undefined) updateFields.semester = input.semester
  if (input.section !== undefined) updateFields.section = input.section

  await Profile.findOneAndUpdate(
    { user_id: uid },
    { $set: updateFields, $setOnInsert: { user_id: uid } },
    { new: true, upsert: true, runValidators: true },
  )

  return getMyProfile(userId)
}

export const updateFacultyProfile = async (
  userId: string,
  input: UpdateFacultyProfileInput,
) => {
  await ensureDepartmentExists(input.department_id)
  const uid = toObjectId(userId, 'userId')

  if (input.name) {
    await User.findByIdAndUpdate(uid, { name: input.name })
  }

  const updateFields: Record<string, unknown> = {}
  if (input.department_id !== undefined) {
    updateFields.department_id = toObjectId(input.department_id, 'department_id')
  }
  if (input.expertise !== undefined) updateFields.expertise = input.expertise
  if (input.achievements !== undefined) updateFields.achievements = input.achievements

  await FacultyProfile.findOneAndUpdate(
    { user_id: uid },
    { $set: updateFields, $setOnInsert: { user_id: uid } },
    { new: true, upsert: true, runValidators: true },
  )

  return getMyProfile(userId)
}

export const addUserSkill = async (userId: string, input: AddUserSkillInput) => {
  const uid = toObjectId(userId, 'userId')
  const skillId = toObjectId(input.skill_id, 'skill_id')

  const skillExists = await Skill.exists({ _id: skillId })
  if (!skillExists) {
    throw new AppError('Skill not found in catalog', 404)
  }

  return UserSkill.findOneAndUpdate(
    { user_id: uid, skill_id: skillId, skill_type: input.skill_type },
    { $set: { proficiency_level: input.proficiency_level } },
    { new: true, upsert: true, runValidators: true },
  ).populate('skill_id', 'skill_name category')
}

export const removeUserSkill = async (userId: string, userSkillId: string) => {
  const deleted = await UserSkill.findOneAndDelete({
    _id: toObjectId(userSkillId, 'userSkillId'),
    user_id: toObjectId(userId, 'userId'),
  })

  if (!deleted) {
    throw new AppError('Skill entry not found', 404)
  }
}

export const createProject = async (
  userId: string,
  input: CreateProjectInput,
) => {
  return Project.create({
    user_id: toObjectId(userId, 'userId'),
    project_title: input.project_title,
    project_link: input.project_link,
  })
}

export const updateProject = async (
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
) => {
  const updated = await Project.findOneAndUpdate(
    {
      _id: toObjectId(projectId, 'projectId'),
      user_id: toObjectId(userId, 'userId'),
    },
    { $set: input },
    { new: true, runValidators: true },
  )

  if (!updated) {
    throw new AppError('Project not found', 404)
  }
  return updated
}

export const deleteProject = async (userId: string, projectId: string) => {
  const deleted = await Project.findOneAndDelete({
    _id: toObjectId(projectId, 'projectId'),
    user_id: toObjectId(userId, 'userId'),
  })
  if (!deleted) {
    throw new AppError('Project not found', 404)
  }
}

export const searchUsers = async (params: {
  q?: string
  role?: 'student' | 'faculty'
  skill_id?: string
  department_id?: string
}) => {
  const filter: Record<string, unknown> = {
    account_status: 'active',
    is_email_verified: true,
    role: params.role ? params.role : { $in: ['student', 'faculty'] },
  }

  if (params.q && params.q.trim()) {
    filter.name = { $regex: params.q.trim(), $options: 'i' }
  }

  let candidateIds: string[] | null = null

  if (params.skill_id) {
    const matches = await UserSkill.find({
      skill_id: toObjectId(params.skill_id, 'skill_id'),
    }).distinct('user_id')
    candidateIds = matches.map((id) => id.toString())
  }

  if (params.department_id) {
    const deptId = toObjectId(params.department_id, 'department_id')
    const [studentIds, facultyIds] = await Promise.all([
      Profile.find({ department_id: deptId }).distinct('user_id'),
      FacultyProfile.find({ department_id: deptId }).distinct('user_id'),
    ])
    const deptSet = new Set([
      ...studentIds.map((id) => id.toString()),
      ...facultyIds.map((id) => id.toString()),
    ])
    candidateIds = candidateIds
      ? candidateIds.filter((id) => deptSet.has(id))
      : Array.from(deptSet)
  }

  if (candidateIds !== null) {
    filter._id = { $in: candidateIds.map((id) => toObjectId(id, 'user_id')) }
  }

  const users = await User.find(filter)
    .select('name role verification_status created_at')
    .sort({ name: 1 })
    .limit(50)

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    role: u.role,
    verification_status: u.verification_status,
  }))
}

export const deleteMyAccount = async (userId: string) => {
  const uid = toObjectId(userId, 'userId')
  const user = await User.findByIdAndUpdate(
    uid,
    {
      $set: {
        account_status: 'deleted',
        name: 'Deleted User',
      },
      $unset: { refresh_token_hash: 1 },
    },
    { new: true },
  )

  if (!user) {
    throw new AppError('Account not found', 404)
  }
}
