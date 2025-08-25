import { put } from "@vercel/blob"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendCompletionNotifications } from "@/lib/completion-notifications"
import {
  generateCompletedDocumentFilename,
  generateSignedPdf,
  validateSignaturesForFinalization,
} from "@/lib/pdf-generator"
import { prisma } from "@/lib/prisma"

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

    // Get document with all signatures and invitations
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        createdById: session.user.id, // Ensure user owns the document
      },
      include: {
        invitations: {
          where: { status: "COMPLETED" },
          include: {
            document: {
              include: {
                signatureFields: true,
              },
            },
          },
        },
        signatureFields: true,
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

    // Check if document is ready for finalization
    if (document.status === "COMPLETED") {
      return NextResponse.json({ error: "Document has already been finalized" }, { status: 400 })
    }

    // Check if all required signatures are collected
    const totalInvitations = await prisma.documentInvitation.count({
      where: { documentId },
    })

    const completedInvitations = document.invitations.length

    if (completedInvitations === 0) {
      return NextResponse.json({ error: "No signatures found to finalize" }, { status: 400 })
    }

    if (completedInvitations !== totalInvitations) {
      return NextResponse.json(
        { error: "Not all required signatures have been collected" },
        { status: 400 }
      )
    }

    // Prepare signature data for PDF generation
    const signatures = document.invitations.map((invitation) => {
      // Find the signature field that matches this invitation (if any)
      // For now, we'll use the first available signature field as a fallback
      const signatureField = document.signatureFields[0] || {
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        page: 1,
      }

      return {
        signatureImageUrl: invitation.signatureUrl!,
        x: signatureField.x,
        y: signatureField.y,
        width: signatureField.width,
        height: signatureField.height,
        page: signatureField.page,
        signerName: invitation.signerName || invitation.recipientName,
        signedAt: invitation.signedAt!,
      }
    })

    // Validate signatures before processing
    const validation = validateSignaturesForFinalization(signatures)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Invalid signatures for finalization",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Generate the final signed PDF
    const signedPdfBytes = await generateSignedPdf({
      originalPdfUrl: document.filePath,
      signatures,
      documentTitle: document.title,
      metadata: {
        author: document.createdBy.name || "Unknown",
        creator: "Comet Document Signing Platform",
        subject: `Signed Document: ${document.title}`,
      },
    })

    // Upload the final signed document to Vercel Blob
    const filename = generateCompletedDocumentFilename(document.title, documentId)
    const signedDocumentBlob = await put(
      `completed-documents/${filename}`,
      Buffer.from(signedPdfBytes),
      {
        contentType: "application/pdf",
        access: "public",
      }
    )

    // Update document status and store the final document URL
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        completedDocumentUrl: signedDocumentBlob.url,
        finalizedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Send completion notifications to all parties
    try {
      // Get all invitations for notification
      const allInvitations = await prisma.documentInvitation.findMany({
        where: { documentId },
      })

      await sendCompletionNotifications(documentId, allInvitations, document)
      console.log(`Completion notifications sent for manually finalized document ${documentId}`)
    } catch (notificationError) {
      console.error("Error sending completion notifications:", notificationError)
      // Don't fail the finalization if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Document finalized successfully",
      document: {
        id: updatedDocument.id,
        title: updatedDocument.title,
        status: updatedDocument.status,
        completedDocumentUrl: updatedDocument.completedDocumentUrl,
        signatures: signatures.map((sig) => ({
          signerName: sig.signerName,
          signedAt: sig.signedAt,
        })),
        totalSignatures: signatures.length,
        finalizedAt: updatedDocument.finalizedAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error("Document finalization error:", error)
    return NextResponse.json(
      {
        error: "Failed to finalize document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
