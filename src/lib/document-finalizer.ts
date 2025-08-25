import { put } from "@vercel/blob"
import {
  generateCompletedDocumentFilename,
  generateSignedPdf,
  validateSignaturesForFinalization,
} from "@/lib/pdf-generator"
import { prisma } from "@/lib/prisma"

/**
 * Internal function to finalize a document without authentication
 * Called when all signatures are collected
 */
export async function finalizeDocumentInternal(documentId: string): Promise<{
  success: boolean
  completedDocumentUrl?: string
  error?: string
}> {
  try {
    // Get document with all signatures and invitations
    const document = await prisma.document.findUnique({
      where: { id: documentId },
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
      return { success: false, error: "Document not found" }
    }

    // Check if document is already finalized
    if (document.completedDocumentUrl) {
      return {
        success: true,
        completedDocumentUrl: document.completedDocumentUrl,
      }
    }

    // Check if all required signatures are collected
    const totalInvitations = await prisma.documentInvitation.count({
      where: { documentId },
    })

    const completedInvitations = document.invitations.length

    if (completedInvitations === 0) {
      return { success: false, error: "No signatures found to finalize" }
    }

    if (completedInvitations !== totalInvitations) {
      return { success: false, error: "Not all required signatures have been collected" }
    }

    // Map signatures to their corresponding signature fields
    const signatures = document.invitations.map((invitation, index) => {
      // Try to match invitation to specific signature field
      // For now, use index or first field as fallback
      const signatureField = document.signatureFields[index] ||
        document.signatureFields[0] || {
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
      return {
        success: false,
        error: `Invalid signatures: ${validation.errors.join(", ")}`,
      }
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
    const signedDocumentBlob = await put(`completed-documents/${filename}`, signedPdfBytes, {
      contentType: "application/pdf",
      access: "public",
    })

    // Update document with completed document URL and finalization timestamp
    await prisma.document.update({
      where: { id: documentId },
      data: {
        completedDocumentUrl: signedDocumentBlob.url,
        finalizedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      completedDocumentUrl: signedDocumentBlob.url,
    }
  } catch (error) {
    console.error("Document finalization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Check if a document is ready for finalization
 */
export async function isDocumentReadyForFinalization(documentId: string): Promise<boolean> {
  const totalInvitations = await prisma.documentInvitation.count({
    where: { documentId },
  })

  const completedInvitations = await prisma.documentInvitation.count({
    where: {
      documentId,
      status: "COMPLETED",
    },
  })

  return totalInvitations > 0 && completedInvitations === totalInvitations
}

/**
 * Get finalization status for a document
 */
export async function getDocumentFinalizationStatus(documentId: string): Promise<{
  isReady: boolean
  isFinalized: boolean
  totalSignatures: number
  completedSignatures: number
  completedDocumentUrl?: string
  finalizedAt?: Date
}> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      completedDocumentUrl: true,
      finalizedAt: true,
    },
  })

  const totalInvitations = await prisma.documentInvitation.count({
    where: { documentId },
  })

  const completedInvitations = await prisma.documentInvitation.count({
    where: {
      documentId,
      status: "COMPLETED",
    },
  })

  return {
    isReady: totalInvitations > 0 && completedInvitations === totalInvitations,
    isFinalized: !!document?.completedDocumentUrl,
    totalSignatures: totalInvitations,
    completedSignatures: completedInvitations,
    completedDocumentUrl: document?.completedDocumentUrl || undefined,
    finalizedAt: document?.finalizedAt || undefined,
  }
}
