import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "Comet Document Signing <noreply@comet-docs.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "support@comet-docs.com",
} as const