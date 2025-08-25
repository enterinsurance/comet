import { put } from "@vercel/blob"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
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

    // If all signatures are collected, update document status
    if (allCompleted) {
      await prisma.document.update({
        where: { id: invitation.documentId },
        data: { status: "COMPLETED" },
      })

      // TODO: Send completion notification emails to all parties
      // This will be implemented in Phase 6.2
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
