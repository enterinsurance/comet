import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Find the signing invitation by token
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
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    if (invitation.status !== "COMPLETED" || !invitation.signedAt) {
      return NextResponse.json({ error: "Document has not been signed yet" }, { status: 400 })
    }

    // Check if all invitations for this document are completed
    const allInvitations = await prisma.documentInvitation.findMany({
      where: { documentId: invitation.documentId },
    })

    const allCompleted = allInvitations.every((inv) => inv.status === "COMPLETED")

    const result = {
      documentName: invitation.document.title,
      signerName: invitation.signerName || invitation.recipientName,
      signedAt: invitation.signedAt.toISOString(),
      senderName: invitation.document.createdBy.name,
      senderEmail: invitation.document.createdBy.email,
      allSignaturesComplete: allCompleted,
      signatureUrl: invitation.signatureUrl,
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("Signing result error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
