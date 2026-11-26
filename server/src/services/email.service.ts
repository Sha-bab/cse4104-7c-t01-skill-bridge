import { env } from '../config/env'
import { AppError } from '../utils/AppError'

interface SendOtpEmailParams {
  to: string
  name: string
  otp: string
  expiresInMinutes: number
}

/**
 * Sends an OTP verification email using Resend when RESEND_API_KEY is configured.
 * In development/test without an API key, logs the OTP to the server console.
 */
export const sendVerificationOtpEmail = async ({
  to,
  name,
  otp,
  expiresInMinutes,
}: SendOtpEmailParams): Promise<void> => {
  const subject = 'Verify your Skill Bridge email'
  const text = `Hello ${name},\n\nYour Skill Bridge verification code is: ${otp}\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, please ignore this email.`

  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === 'production') {
      throw new AppError(
        'Email service is not configured for production',
        500,
      )
    }
    console.log(
      `📧 [DEV EMAIL] To: ${to} | OTP: ${otp} (expires in ${expiresInMinutes}m)`,
    )
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ Resend API error:', response.status, errorBody)
    throw new AppError('Failed to send verification email', 502)
  }
}
