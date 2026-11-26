import { Router } from 'express'
import { z } from 'zod'
import * as academicController from '../controllers/academic.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  assignCourseFacultySchema,
  createCourseSchema,
  createDepartmentSchema,
  createSkillSchema,
  updateCourseSchema,
} from '../types/phase2.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

// Public / authenticated catalog reads
router.get('/departments', academicController.listDepartments)
router.get('/courses', academicController.listCourses)
router.get(
  '/courses/:courseId',
  validateRequest({ params: z.object({ courseId: objectIdSchema }) }),
  academicController.getCourseDetails,
)
router.get('/skills', academicController.listSkills)

// Admin management endpoints (FR-54, FR-55)
router.post(
  '/departments',
  authenticate,
  authorize('admin'),
  validateRequest({ body: createDepartmentSchema }),
  academicController.createDepartment,
)

router.post(
  '/courses',
  authenticate,
  authorize('admin'),
  validateRequest({ body: createCourseSchema }),
  academicController.createCourse,
)

router.patch(
  '/courses/:courseId',
  authenticate,
  authorize('admin'),
  validateRequest({
    params: z.object({ courseId: objectIdSchema }),
    body: updateCourseSchema,
  }),
  academicController.updateCourse,
)

router.post(
  '/courses/:courseId/faculty',
  authenticate,
  authorize('admin'),
  validateRequest({
    params: z.object({ courseId: objectIdSchema }),
    body: assignCourseFacultySchema,
  }),
  academicController.assignFaculty,
)

router.delete(
  '/courses/:courseId/faculty/:facultyId',
  authenticate,
  authorize('admin'),
  validateRequest({
    params: z.object({
      courseId: objectIdSchema,
      facultyId: objectIdSchema,
    }),
  }),
  academicController.removeFaculty,
)

router.post(
  '/skills',
  authenticate,
  authorize('admin', 'moderator'),
  validateRequest({ body: createSkillSchema }),
  academicController.createSkill,
)

export default router
