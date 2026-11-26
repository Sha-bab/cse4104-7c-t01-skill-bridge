import 'dotenv/config'
import { z } from 'zod'

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z
      .string({
        required_error:
          'MONGODB_URI is required. Copy server/.env.example to server/.env and add your MongoDB Atlas connection string.',
      })
      .trim()
      .refine(
        (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
        'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"',
      ),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    JWT_SECRET: z
      .string({
        required_error: 'JWT_SECRET is required in server/.env',
      })
      .min(16, 'JWT_SECRET must be at least 16 characters long'),
    JWT_EXPIRES_IN: z.string().min(1).default('15m'),
    JWT_REFRESH_SECRET: z
      .string({
        required_error: 'JWT_REFRESH_SECRET is required in server/.env',
      })
      .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long'),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
    OTP_EXPIRES_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
    EMAIL_FROM: z
      .string()
      .min(1)
      .default('Skill Bridge <no-reply@skillbridge.local>'),
    RESEND_API_KEY: z.string().optional().default(''),
    GEMINI_API_KEY: z.string().optional().default(''),
    GEMINI_CHAT_MODEL: z.string().min(1).default('gemini-2.5-flash'),
    GEMINI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-004'),
    ATLAS_VECTOR_INDEX: z.string().min(1).default('note_chunks_vector_index'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be at least 32 characters in production',
        })
      }
      if (data.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message:
            'JWT_REFRESH_SECRET must be at least 32 characters in production',
        })
      }
    }
  })

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:')
  for (const issue of parsedEnv.error.issues) {
    const key = issue.path.join('.') || 'ENV'
    console.error(`   - ${key}: ${issue.message}`)
  }
  console.error(
    '💡 Make sure server/.env exists (you can copy server/.env.example).',
  )
  process.exit(1)
}

export const env = parsedEnv.data
