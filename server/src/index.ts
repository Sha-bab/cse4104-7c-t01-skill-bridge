import http from 'http'
import app from './app'
import { connectDB, disconnectDB } from './config/db'
import { env } from './config/env'

let server: http.Server | null = null
let isShuttingDown = false

const shutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`)

  const forceExitTimer = setTimeout(() => {
    console.error('⏱️ Forced shutdown after timeout')
    process.exit(1)
  }, 10_000)
  forceExitTimer.unref()

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }
    await disconnectDB()
    clearTimeout(forceExitTimer)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err)
    process.exit(1)
  }
}

const bootstrap = async (): Promise<void> => {
  try {
    await connectDB()

    server = app.listen(env.PORT, () => {
      console.log(
        `🚀 Skill Bridge server running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`,
      )
    })

    process.on('SIGINT', () => {
      void shutdown('SIGINT')
    })
    process.on('SIGTERM', () => {
      void shutdown('SIGTERM')
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

void bootstrap()
