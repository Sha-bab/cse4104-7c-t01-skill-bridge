import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { getDatabaseStatus } from './config/db'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import academicRoutes from './routes/academic.routes'
import adminRoutes from './routes/admin.routes'
import aiRoutes from './routes/ai.routes'
import authRoutes from './routes/auth.routes'
import facultyRoutes from './routes/faculty.routes'
import feedRoutes from './routes/feed.routes'
import messagingRoutes from './routes/messaging.routes'
import moderationRoutes from './routes/moderation.routes'
import notificationRoutes from './routes/notification.routes'
import profileRoutes from './routes/profile.routes'
import resourceRoutes from './routes/resource.routes'
import skillExchangeRoutes from './routes/skillExchange.routes'
import starRoutes from './routes/star.routes'

const app = express()

// Security headers & CORS
app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
)

// Body parsers with explicit payload limits
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
})
app.use('/api', apiLimiter)

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  })
})

// Feature routers
app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/academics', academicRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/stars', starRoutes)
app.use('/api/skill-exchange', skillExchangeRoutes)
app.use('/api/messages', messagingRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/feed', feedRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/moderation', moderationRoutes)

// 404 & global error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
