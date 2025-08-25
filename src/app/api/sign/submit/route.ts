import { put } from "@vercel/blob"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { sendCompletionNotifications } from "@/lib/completion-notifications"
import { prisma } from "@/lib/prisma"
import {
  createSignatureAudit,
  generateSignatureFilename,
  validateSignatureData,
  validateSignerInfo,
} from "@/lib/signature-validation"

export async function POST(request: NextRequest) {
  try {
    const { token, signatureData, signerName, signerTitle, signerNotes } = await request.json()

    if (!token || !signatureData || !signerName) {
      return NextResponse.json(
        { error: "Token, signature data, and signer name are required" },
        { status: 400 }
      )
    }

    // Validate signature data
    const signatureValidation = validateSignatureData(signatureData)
    if (!signatureValidation.isValid) {
      return NextResponse.json({ error: signatureValidation.error }, { status: 400 })
    }

    // Validate signer information
    const signerValidation = validateSignerInfo(signerName)
    if (!signerValidation.isValid) {
      return NextResponse.json({ error: signerValidation.error }, { status: 400 })
    }

    // Validate token and get invitation
    const invitation = await prisma.documentInvitation.findUnique({
      where: { token },
      include: {
        document: {
          include: {
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invalid signing token" }, { status: 404 })
    }

    // Check if token is expired
    const now = new Date()
    if (invitation.expiresAt < now) {
      return NextResponse.json({ error: "Signing link has expired" }, { status: 400 })
    }

    // Check if already completed
    if (invitation.status === "COMPLETED") {
      return NextResponse.json({ error: "Document has already been signed" }, { status: 400 })
    }

    // Create audit trail
    const auditData = createSignatureAudit(request)

    // Convert base64 signature to blob and upload
    const base64Data = signatureData.split(",")[1]
    const signatureBuffer = Buffer.from(base64Data, "base64")

    const filename = generateSignatureFilename(invitation.id)
    const signatureBlobResult = await put(filename, signatureBuffer, {
      contentType: "image/png",
      access: "public",
    })

    // Update invitation with signature data
    await prisma.documentInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "COMPLETED",
        signedAt: auditData.timestamp,
        signatureUrl: signatureBlobResult.url,
        signerName: signerName.trim(),
        signerTitle: signerTitle?.trim() || null,
        signerNotes: signerNotes?.trim() || null,
        signerIpAddress: auditData.ipAddress,
        signerUserAgent: auditData.userAgent,
      },
    })

    // Check if all invitations for this document are completed
    const allInvitations = await prisma.documentInvitation.findMany({
      where: { documentId: invitation.documentId },
    })

    const allCompleted = allInvitations.every((inv) => inv.status === "COMPLETED")

    // If all signatures are collected, update document status and trigger finalization
    if (allCompleted) {
      await prisma.document.update({
        where: { id: invitation.documentId },
        data: { status: "COMPLETED" },
      })

      // Trigger automatic PDF finalization in the background
      // We'll create an internal finalize function to avoid authentication issues
      try {
        const { finalizeDocumentInternal } = await import("@/lib/document-finalizer")
        await finalizeDocumentInternal(invitation.documentId)
        console.log(`Document ${invitation.documentId} finalized successfully`)
      } catch (finalizationError) {
        console.error("Error finalizing document:", finalizationError)
        // Don't fail the signature submission if finalization fails
      }

      // Send completion notifications to all parties
      try {
        await sendCompletionNotifications(
          invitation.documentId,
          allInvitations,
          invitation.document
        )
        console.log(`Completion notifications sent for document ${invitation.documentId}`)
      } catch (notificationError) {
        console.error("Error sending completion notifications:", notificationError)
        // Don't fail the signature submission if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document signed successfully",
      signatureUrl: signatureBlobResult.url,
      allSignaturesComplete: allCompleted,
    })
  } catch (error) {
    console.error("Signature submission error:", error)
    return NextResponse.json({ error: "Failed to submit signature" }, { status: 500 })
  }
}
