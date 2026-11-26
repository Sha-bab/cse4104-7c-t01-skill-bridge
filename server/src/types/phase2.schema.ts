import { z } from 'zod'
import { PROFICIENCY_LEVELS, USER_SKILL_TYPES } from '../models'
import { objectIdSchema } from '../utils/objectId'

export const updateStudentProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  department_id: objectIdSchema.optional(),
  profile_picture: z.string().trim().url().max(500).optional(),
  bio: z.string().trim().max(1000).optional(),
  semester: z.string().trim().max(30).optional(),
  section: z.string().trim().max(20).optional(),
})

export const updateFacultyProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  department_id: objectIdSchema.optional(),
  expertise: z.string().trim().max(1000).optional(),
  achievements: z.string().trim().max(2000).optional(),
})

export const addUserSkillSchema = z.object({
  skill_id: objectIdSchema,
  skill_type: z.enum(USER_SKILL_TYPES),
  proficiency_level: z.enum(PROFICIENCY_LEVELS).default('intermediate'),
})

export const createProjectSchema = z.object({
  project_title: z.string().trim().min(2).max(150),
  project_link: z.string().trim().url().max(500),
})

export const updateProjectSchema = createProjectSchema.partial().refine(
  (data) => data.project_title !== undefined || data.project_link !== undefined,
  'Provide at least one field to update',
)

export const createDepartmentSchema = z.object({
  department_name: z.string().trim().min(2).max(120),
  department_code: z.string().trim().min(2).max(20).toUpperCase(),
})

export const createCourseSchema = z.object({
  department_id: objectIdSchema,
  course_code: z.string().trim().min(2).max(30).toUpperCase(),
  course_name: z.string().trim().min(2).max(150),
  semester: z.string().trim().max(30).optional(),
})

export const updateCourseSchema = createCourseSchema.partial()

export const assignCourseFacultySchema = z.object({
  faculty_id: objectIdSchema,
})

export const createSkillSchema = z.object({
  skill_name: z.string().trim().min(1).max(80),
  category: z.string().trim().min(2).max(60),
})

export const updateUserAccountStatusSchema = z.object({
  account_status: z.enum(['active', 'restricted', 'suspended', 'blocked']),
  restriction_reason: z.string().trim().max(500).optional(),
})

export const updateVerificationStatusSchema = z.object({
  verification_status: z.enum(['pending', 'verified', 'rejected']),
})

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>
export type UpdateFacultyProfileInput = z.infer<typeof updateFacultyProfileSchema>
export type AddUserSkillInput = z.infer<typeof addUserSkillSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
export type CreateSkillInput = z.infer<typeof createSkillSchema>
export type UpdateUserAccountStatusInput = z.infer<
  typeof updateUserAccountStatusSchema
>
export type UpdateVerificationStatusInput = z.infer<
  typeof updateVerificationStatusSchema
>
