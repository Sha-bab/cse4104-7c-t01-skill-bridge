import mongoose from 'mongoose'
import { env } from './env'

let listenersRegistered = false

const READY_STATE_LABELS: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

const registerConnectionListeners = (): void => {
  if (listenersRegistered) {
    return
  }

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err.message)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected')
  })

  listenersRegistered = true
}

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Throws if the connection fails so the server does not start without a database.
 */
export const connectDB = async (): Promise<void> => {
  registerConnectionListeners()

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: env.NODE_ENV !== 'production',
  })

  const { host, name } = mongoose.connection
  console.log(`✅ MongoDB connected (host: ${host}, db: ${name})`)
}

/**
 * Gracefully closes the active Mongoose connection during server shutdown.
 */
export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    console.log('🔌 MongoDB disconnected gracefully')
  }
}

/**
 * Returns a human-readable connection state for health checks.
 */
export const getDatabaseStatus = (): string => {
  return READY_STATE_LABELS[mongoose.connection.readyState] ?? 'unknown'
}
