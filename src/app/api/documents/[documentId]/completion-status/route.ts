import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDocumentFinalizationStatus } from "@/lib/document-finalizer"
import { prisma } from "@/lib/prisma"

export async function GET(
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

    // Get document with all related data - check if user has access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { createdById: session.user.id }, // Document owner
          {
            invitations: {
              some: {
                recipientEmail: session.user.email, // Invited signer
              },
            },
          },
        ],
      },
      include: {
        invitations: {
          orderBy: {
            createdAt: "asc",
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    // Get finalization status
    const finalizationStatus = await getDocumentFinalizationStatus(documentId)

    // Build signatures array from completed invitations
    const signatures = document.invitations
      .filter((inv) => inv.status === "COMPLETED" && inv.signedAt)
      .map((inv) => ({
        signerName: inv.signerName || inv.recipientName,
        signedAt: inv.signedAt!.toISOString(),
        recipientEmail: inv.recipientEmail,
      }))
      .sort((a, b) => new Date(a.signedAt).getTime() - new Date(b.signedAt).getTime())

    // Calculate completion metrics
    const completionMetrics = {
      totalSignatures: finalizationStatus.totalSignatures,
      completedSignatures: finalizationStatus.completedSignatures,
      progressPercentage:
        finalizationStatus.totalSignatures > 0
          ? Math.round(
              (finalizationStatus.completedSignatures / finalizationStatus.totalSignatures) * 100
            )
          : 0,
      isFullyComplete: finalizationStatus.isReady,
      isDocumentFinalized: finalizationStatus.isFinalized,
    }

    // Build response
    const responseData = {
      document: {
        id: document.id,
        title: document.title,
        status: document.status,
        finalizedAt: finalizationStatus.finalizedAt?.toISOString() || null,
        completedDocumentUrl: finalizationStatus.completedDocumentUrl || null,
        createdAt: document.createdAt.toISOString(),
        owner: {
          name: document.createdBy.name,
          email: document.createdBy.email,
        },
      },
      signatures,
      invitations: document.invitations.map((inv) => ({
        id: inv.id,
        recipientName: inv.recipientName,
        recipientEmail: inv.recipientEmail,
        status: inv.status,
        signedAt: inv.signedAt?.toISOString() || null,
        viewedAt: null, // Field not implemented yet
        sentAt: inv.createdAt.toISOString(), // Use creation time as sent time
        expiresAt: inv.expiresAt.toISOString(),
      })),
      metrics: completionMetrics,
      finalizationStatus,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Completion status error:", error)
    return NextResponse.json({ error: "Failed to retrieve completion status" }, { status: 500 })
  }
}
