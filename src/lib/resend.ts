import { Resend } from "resend"

// Lazy initialization to avoid issues with environment variables during build
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      console.error('Environment variables available:', {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? '[SET]' : '[NOT SET]',
        EMAIL_FROM: process.env.EMAIL_FROM ? '[SET]' : '[NOT SET]',
        EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO ? '[SET]' : '[NOT SET]',
        NODE_ENV: process.env.NODE_ENV,
      })
      throw new Error("RESEND_API_KEY environment variable is required. Please check your .env file.")
    }
    
    resendClient = new Resend(apiKey)
  }
  
  return resendClient
}

export const resend = {
  get emails() {
    return getResendClient().emails
  }
}

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "Comet Document Signing <noreply@enterinsurance.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "support@enterinsurance.com",
} as const