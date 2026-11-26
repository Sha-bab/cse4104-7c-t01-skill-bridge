import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db'
import '../models'

/**
 * Synchronizes Mongoose schema indexes with MongoDB Atlas collections.
 * Safe to run before deployments or after updating schema indexes.
 */
const syncAllIndexes = async (): Promise<void> => {
  await connectDB()

  const modelNames = mongoose.modelNames()
  for (const name of modelNames) {
    const model = mongoose.model(name)
    await model.syncIndexes()
    console.log(`✅ Synced indexes for ${name}`)
  }

  await disconnectDB()
}

syncAllIndexes().catch(async (err) => {
  console.error('❌ Failed to sync indexes:', err)
  await disconnectDB()
  process.exit(1)
})
