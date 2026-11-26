import 'dotenv/config'

export const PORT      = process.env.PORT      || '5000'
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillbridge'
export const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production'
