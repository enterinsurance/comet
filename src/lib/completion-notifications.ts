import { getDocumentFinalizationStatus } from "@/lib/document-finalizer"
import { type SendCompletionNotificationProps, sendCompletionNotification } from "@/lib/email"

interface DocumentInvitation {
  id: string
  recipientEmail: string
  recipientName: string
  signerName?: string | null
  signedAt?: Date | null
  status: string
}

interface Document {
  id: string
  title: string
  createdBy: {
    name: string | null
    email: string
  }
}

/**
 * Send completion notifications to all parties involved in document signing
 */
export async function sendCompletionNotifications(
  documentId: string,
  allInvitations: DocumentInvitation[],
  document: Document
): Promise<void> {
  try {
    // Get the current finalization status
    const finalizationStatus = await getDocumentFinalizationStatus(documentId)

    // Find the most recently completed invitation (the one that triggered completion)
    const completedInvitations = allInvitations.filter((inv) => inv.status === "COMPLETED")
    const lastCompletedInvitation = completedInvitations.sort(
      (a, b) => (b.signedAt?.getTime() || 0) - (a.signedAt?.getTime() || 0)
    )[0]

    if (!lastCompletedInvitation?.signedAt) {
      console.warn("No recently completed invitation found for notifications")
      return
    }

    const signerName = lastCompletedInvitation.signerName || lastCompletedInvitation.recipientName
    const completedAt = lastCompletedInvitation.signedAt

    // Prepare notification list - include document owner and all recipients
    const recipients = new Set<string>()

    // Add document owner
    recipients.add(document.createdBy.email)

    // Add all recipients who were invited to sign
    allInvitations.forEach((invitation) => {
      recipients.add(invitation.recipientEmail)
    })

    // Send notifications to all parties
    const notificationPromises = Array.from(recipients).map(async (email) => {
      // Determine recipient name
      let recipientName = "User"

      if (email === document.createdBy.email) {
        recipientName = document.createdBy.name || "Document Owner"
      } else {
        const invitation = allInvitations.find((inv) => inv.recipientEmail === email)
        recipientName = invitation?.recipientName || "Recipient"
      }

      const notificationProps: SendCompletionNotificationProps = {
        to: email,
        recipientName,
        documentTitle: document.title,
        signerName,
        completedAt,
        downloadUrl: finalizationStatus.completedDocumentUrl,
        totalSignatures: finalizationStatus.totalSignatures,
        completedSignatures: finalizationStatus.completedSignatures,
      }

      try {
        await sendCompletionNotification(notificationProps)
        console.log(`Completion notification sent to ${email}`)
      } catch (error) {
        console.error(`Failed to send completion notification to ${email}:`, error)
        throw error
      }
    })

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises)

    console.log(`All completion notifications sent successfully for document ${documentId}`)
  } catch (error) {
    console.error("Error sending completion notifications:", error)
    throw error
  }
}

/**
 * Send a single completion notification with retry logic
 */
export async function sendSingleCompletionNotification(
  props: SendCompletionNotificationProps,
  retries: number = 2
): Promise<void> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await sendCompletionNotification(props)
      return
    } catch (error) {
      console.warn(`Notification attempt ${attempt + 1} failed for ${props.to}:`, error)

      if (attempt === retries) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      const delay = 2 ** attempt * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Send delayed completion notification (useful for documents that need processing time)
 */
export async function sendDelayedCompletionNotification(
  documentId: string,
  delayMs: number = 5000
): Promise<void> {
  setTimeout(async () => {
    try {
      // Re-fetch document data to ensure it's up to date
      const { prisma } = await import("@/lib/prisma")

      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          invitations: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      if (!document) {
        console.error(`Document ${documentId} not found for delayed notification`)
        return
      }

      await sendCompletionNotifications(documentId, document.invitations, document)
    } catch (error) {
      console.error("Error sending delayed completion notification:", error)
    }
  }, delayMs)
}
