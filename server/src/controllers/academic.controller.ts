import { Request, Response } from 'express'
import * as academicService from '../services/academic.service'
import {
  CreateCourseInput,
  CreateDepartmentInput,
  CreateSkillInput,
  UpdateCourseInput,
} from '../types/phase2.schema'
import { asyncHandler } from '../utils/asyncHandler'

export const listDepartments = asyncHandler(
  async (_req: Request, res: Response) => {
    const departments = await academicService.listDepartments()
    res.status(200).json({ success: true, data: { departments } })
  },
)

export const createDepartment = asyncHandler(
  async (req: Request, res: Response) => {
    const department = await academicService.createDepartment(
      req.body as CreateDepartmentInput,
    )
    res.status(201).json({
      success: true,
      message: 'Department created',
      data: { department },
    })
  },
)

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const { department_id, semester, q } = req.query as {
    department_id?: string
    semester?: string
    q?: string
  }
  const courses = await academicService.listCourses({
    department_id,
    semester,
    q,
  })
  res.status(200).json({ success: true, data: { courses } })
})

export const getCourseDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await academicService.getCourseWithFaculty(req.params.courseId)
    res.status(200).json({ success: true, data })
  },
)

export const createCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await academicService.createCourse(
      req.body as CreateCourseInput,
    )
    res.status(201).json({
      success: true,
      message: 'Course created',
      data: { course },
    })
  },
)

export const updateCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await academicService.updateCourse(
      req.params.courseId,
      req.body as UpdateCourseInput,
    )
    res.status(200).json({
      success: true,
      message: 'Course updated',
      data: { course },
    })
  },
)

export const assignFaculty = asyncHandler(
  async (req: Request, res: Response) => {
    const { faculty_id } = req.body as { faculty_id: string }
    const assignment = await academicService.assignFacultyToCourse(
      req.params.courseId,
      faculty_id,
    )
    res.status(201).json({
      success: true,
      message: 'Faculty assigned to course',
      data: { assignment },
    })
  },
)

export const removeFaculty = asyncHandler(
  async (req: Request, res: Response) => {
    await academicService.removeFacultyFromCourse(
      req.params.courseId,
      req.params.facultyId,
    )
    res.status(200).json({
      success: true,
      message: 'Faculty removed from course',
    })
  },
)

export const listSkills = asyncHandler(async (req: Request, res: Response) => {
  const { category, q } = req.query as { category?: string; q?: string }
  const skills = await academicService.listSkills({ category, q })
  res.status(200).json({ success: true, data: { skills } })
})

export const createSkill = asyncHandler(async (req: Request, res: Response) => {
  const skill = await academicService.createSkill(req.body as CreateSkillInput)
  res.status(201).json({
    success: true,
    message: 'Skill added to catalog',
    data: { skill },
  })
})
