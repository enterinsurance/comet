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
            signatureFields: true,
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
      return NextResponse.json({ error: "Invalid or expired signing link" }, { status: 404 })
    }

    // Check if token is expired
    const now = new Date()
    const isExpired = invitation.expiresAt < now

    // Check if already completed
    const isCompleted = invitation.status === "COMPLETED"

    // Prepare signing data
    const signingData = {
      id: invitation.id,
      documentId: invitation.documentId,
      documentUrl: invitation.document.filePath,
      documentName: invitation.document.title,
      recipientEmail: invitation.recipientEmail,
      recipientName: invitation.recipientName,
      expiresAt: invitation.expiresAt.toISOString(),
      signatureFields: invitation.document.signatureFields.map((field) => ({
        id: field.id,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        page: field.page,
        required: field.required,
      })),
      isExpired,
      isCompleted,
      senderName: invitation.document.createdBy.name,
      senderEmail: invitation.document.createdBy.email,
    }

    return NextResponse.json({
      success: true,
      signingData,
    })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
