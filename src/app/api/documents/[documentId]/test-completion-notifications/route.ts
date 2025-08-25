import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendCompletionNotifications } from "@/lib/completion-notifications"
import { prisma } from "@/lib/prisma"

/**
 * Test endpoint to manually send completion notifications for a document
 * Only available in development or for testing purposes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { documentId } = await params

    // Get document with all related data - check if user owns the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        createdById: session.user.id, // Only document owner can test notifications
      },
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
      return NextResponse.json({ error: "Document not found or unauthorized" }, { status: 404 })
    }

    // Check if document has completed signatures
    const completedInvitations = document.invitations.filter((inv) => inv.status === "COMPLETED")

    if (completedInvitations.length === 0) {
      return NextResponse.json(
        { error: "No completed signatures found for notification testing" },
        { status: 400 }
      )
    }

    // Send test completion notifications
    try {
      await sendCompletionNotifications(documentId, document.invitations, document)

      return NextResponse.json({
        success: true,
        message: "Test completion notifications sent successfully",
        data: {
          documentTitle: document.title,
          totalInvitations: document.invitations.length,
          completedSignatures: completedInvitations.length,
          notificationsSentTo: [
            document.createdBy.email, // Document owner
            ...document.invitations.map((inv) => inv.recipientEmail), // All recipients
          ],
        },
      })
    } catch (notificationError) {
      console.error("Error sending test completion notifications:", notificationError)
      return NextResponse.json(
        {
          error: "Failed to send test completion notifications",
          details: notificationError instanceof Error ? notificationError.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Test completion notifications error:", error)
    return NextResponse.json(
      { error: "Failed to process test completion notifications" },
      { status: 500 }
    )
  }
}
