import { render } from "@react-email/render"
import { SigningInvitationEmail } from "@/emails/signing-invitation"
import { SigningCompletionEmail } from "@/emails/signing-completion"
import { EMAIL_CONFIG, resend } from "@/lib/resend"

export interface SendSigningInvitationProps {
  to: string
  recipientName?: string
  senderName: string
  documentTitle: string
  signingUrl: string
  expiresAt: Date
  message?: string
}

export interface SendCompletionNotificationProps {
  to: string
  recipientName: string
  documentTitle: string
  signerName: string
  completedAt: Date
  downloadUrl?: string
  totalSignatures: number
  completedSignatures: number
}

/**
 * Send a signing invitation email to a recipient
 */
export async function sendSigningInvitation({
  to,
  recipientName,
  senderName,
  documentTitle,
  signingUrl,
  expiresAt,
  message,
}: SendSigningInvitationProps) {
  try {
    // Calculate days until expiration
    const now = new Date()
    const diffTime = expiresAt.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const expiresText = diffDays === 1 ? "1 day" : `${diffDays} days`

    const emailHtml = await render(
      SigningInvitationEmail({
        recipientName,
        senderName,
        documentTitle,
        signingUrl,
        expiresAt: expiresText,
        message,
      })
    )

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Signature Request: ${documentTitle}`,
      html: emailHtml,
    })

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    console.error("Error sending signing invitation:", error)
    throw error
  }
}

/**
 * Send a signing completion notification
 */
export async function sendCompletionNotification({
  to,
  recipientName,
  documentTitle,
  signerName,
  completedAt,
  downloadUrl,
  totalSignatures,
  completedSignatures,
}: SendCompletionNotificationProps) {
  try {
    const isFullyComplete = completedSignatures === totalSignatures
    const completedAtText = completedAt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

    const emailHtml = await render(
      SigningCompletionEmail({
        recipientName,
        documentTitle,
        signerName,
        completedAt: completedAtText,
        downloadUrl,
        totalSignatures,
        completedSignatures,
      })
    )

    const subject = isFullyComplete
      ? `Document Complete: ${documentTitle}`
      : `Signature Received: ${documentTitle}`

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html: emailHtml,
    })

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    console.error("Error sending completion notification:", error)
    throw error
  }
}

/**
 * Send bulk signing invitations
 */
export async function sendBulkSigningInvitations(
  invitations: SendSigningInvitationProps[]
) {
  const results = []
  
  for (const invitation of invitations) {
    try {
      const result = await sendSigningInvitation(invitation)
      results.push({
        email: invitation.to,
        success: true,
        messageId: result.messageId,
      })
    } catch (error) {
      results.push({
        email: invitation.to,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
  
  return results
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize email for safe display
 */
export function sanitizeEmailForDisplay(email: string): string {
  if (!email || !isValidEmail(email)) return "Invalid email"
  
  const [localPart, domain] = email.split("@")
  if (localPart.length <= 3) {
    return `${localPart}***@${domain}`
  }
  
  return `${localPart.substring(0, 3)}***@${domain}`
}