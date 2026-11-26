import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// TODO: mount routers here
// app.use('/api/auth',    authRoutes)
// app.use('/api/users',   userRoutes)
// app.use('/api/skills',  skillRoutes)
// app.use('/api/sessions',sessionRoutes)

export default app
