import { Course, CourseFaculty, Department, Skill, User } from '../models'
import {
  CreateCourseInput,
  CreateDepartmentInput,
  CreateSkillInput,
  UpdateCourseInput,
} from '../types/phase2.schema'
import { AppError } from '../utils/AppError'
import { toObjectId } from '../utils/objectId'

export const listDepartments = async () => {
  return Department.find().sort({ department_code: 1 })
}

export const createDepartment = async (input: CreateDepartmentInput) => {
  return Department.create(input)
}

export const listCourses = async (filters: {
  department_id?: string
  semester?: string
  q?: string
}) => {
  const query: Record<string, unknown> = {}
  if (filters.department_id) {
    query.department_id = toObjectId(filters.department_id, 'department_id')
  }
  if (filters.semester) {
    query.semester = filters.semester.trim()
  }
  if (filters.q && filters.q.trim()) {
    const regex = new RegExp(filters.q.trim(), 'i')
    query.$or = [{ course_code: regex }, { course_name: regex }]
  }

  return Course.find(query)
    .populate('department_id', 'department_name department_code')
    .sort({ course_code: 1 })
}

export const getCourseWithFaculty = async (courseId: string) => {
  const cid = toObjectId(courseId, 'courseId')
  const course = await Course.findById(cid).populate(
    'department_id',
    'department_name department_code',
  )
  if (!course) {
    throw new AppError('Course not found', 404)
  }

  const facultyAssignments = await CourseFaculty.find({ course_id: cid }).populate(
    'faculty_id',
    'name role verification_status',
  )

  return {
    course,
    faculty: facultyAssignments.map((fa) => fa.faculty_id),
  }
}

export const createCourse = async (input: CreateCourseInput) => {
  const deptId = toObjectId(input.department_id, 'department_id')
  const deptExists = await Department.exists({ _id: deptId })
  if (!deptExists) {
    throw new AppError('Department not found', 404)
  }

  return Course.create({
    ...input,
    department_id: deptId,
  })
}

export const updateCourse = async (
  courseId: string,
  input: UpdateCourseInput,
) => {
  const cid = toObjectId(courseId, 'courseId')
  if (input.department_id) {
    const deptExists = await Department.exists({
      _id: toObjectId(input.department_id, 'department_id'),
    })
    if (!deptExists) {
      throw new AppError('Department not found', 404)
    }
  }

  const updated = await Course.findByIdAndUpdate(
    cid,
    { $set: input },
    { new: true, runValidators: true },
  )
  if (!updated) {
    throw new AppError('Course not found', 404)
  }
  return updated
}

export const assignFacultyToCourse = async (
  courseId: string,
  facultyId: string,
) => {
  const cid = toObjectId(courseId, 'courseId')
  const fid = toObjectId(facultyId, 'faculty_id')

  const [course, faculty] = await Promise.all([
    Course.exists({ _id: cid }),
    User.findOne({ _id: fid, role: 'faculty', account_status: 'active' }),
  ])

  if (!course) {
    throw new AppError('Course not found', 404)
  }
  if (!faculty) {
    throw new AppError('Active faculty user not found', 404)
  }

  return CourseFaculty.findOneAndUpdate(
    { course_id: cid, faculty_id: fid },
    { $setOnInsert: { course_id: cid, faculty_id: fid } },
    { new: true, upsert: true },
  )
}

export const removeFacultyFromCourse = async (
  courseId: string,
  facultyId: string,
) => {
  const deleted = await CourseFaculty.findOneAndDelete({
    course_id: toObjectId(courseId, 'courseId'),
    faculty_id: toObjectId(facultyId, 'faculty_id'),
  })
  if (!deleted) {
    throw new AppError('Course-faculty assignment not found', 404)
  }
}

export const listSkills = async (filters: { category?: string; q?: string }) => {
  const query: Record<string, unknown> = {}
  if (filters.category) {
    query.category = filters.category.trim()
  }
  if (filters.q && filters.q.trim()) {
    query.skill_name = { $regex: filters.q.trim(), $options: 'i' }
  }
  return Skill.find(query).sort({ skill_name: 1 })
}

export const createSkill = async (input: CreateSkillInput) => {
  return Skill.create(input)
}
