import { Router } from 'express'
import { z } from 'zod'
import * as profileController from '../controllers/profile.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  addUserSkillSchema,
  createProjectSchema,
  updateFacultyProfileSchema,
  updateProjectSchema,
  updateStudentProfileSchema,
} from '../types/phase2.schema'
import { objectIdSchema } from '../utils/objectId'

const router = Router()

router.use(authenticate)

router.get('/me', profileController.getMyProfile)
router.delete('/me', profileController.deleteMyAccount)

router.put(
  '/me/student',
  authorize('student'),
  validateRequest({ body: updateStudentProfileSchema }),
  profileController.updateStudentProfile,
)

router.put(
  '/me/faculty',
  authorize('faculty'),
  validateRequest({ body: updateFacultyProfileSchema }),
  profileController.updateFacultyProfile,
)

router.post(
  '/me/skills',
  validateRequest({ body: addUserSkillSchema }),
  profileController.addUserSkill,
)

router.delete(
  '/me/skills/:userSkillId',
  validateRequest({ params: z.object({ userSkillId: objectIdSchema }) }),
  profileController.removeUserSkill,
)

router.post(
  '/me/projects',
  validateRequest({ body: createProjectSchema }),
  profileController.createProject,
)

router.patch(
  '/me/projects/:projectId',
  validateRequest({
    params: z.object({ projectId: objectIdSchema }),
    body: updateProjectSchema,
  }),
  profileController.updateProject,
)

router.delete(
  '/me/projects/:projectId',
  validateRequest({ params: z.object({ projectId: objectIdSchema }) }),
  profileController.deleteProject,
)

router.get('/search', profileController.searchUsers)

router.get(
  '/:userId',
  validateRequest({ params: z.object({ userId: objectIdSchema }) }),
  profileController.getPublicProfile,
)

export default router
