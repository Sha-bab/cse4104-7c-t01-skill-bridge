import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validateRequest'
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerFacultySchema,
  registerStudentSchema,
  resendOtpSchema,
  verifyEmailSchema,
} from '../types/auth.schema'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
})

router.post(
  '/register/student',
  authLimiter,
  validateRequest({ body: registerStudentSchema }),
  authController.registerStudent,
)

router.post(
  '/register/faculty',
  authLimiter,
  validateRequest({ body: registerFacultySchema }),
  authController.registerFaculty,
)

router.post(
  '/verify-email',
  authLimiter,
  validateRequest({ body: verifyEmailSchema }),
  authController.verifyEmail,
)

router.post(
  '/resend-otp',
  authLimiter,
  validateRequest({ body: resendOtpSchema }),
  authController.resendOtp,
)

router.post(
  '/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  authController.login,
)

router.post(
  '/admin/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  authController.adminLogin,
)

router.post(
  '/refresh',
  authLimiter,
  validateRequest({ body: refreshTokenSchema }),
  authController.refreshToken,
)

router.post('/logout', authenticate, authController.logout)

router.patch(
  '/change-password',
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword,
)

router.get('/me', authenticate, authController.getMe)

export default router
