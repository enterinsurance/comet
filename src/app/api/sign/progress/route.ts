import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
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
      select: {
        id: true,
        status: true,
        expiresAt: true,
        documentId: true,
        recipientName: true,
        recipientEmail: true,
        signedAt: true,
        document: {
          select: {
            id: true,
            title: true,
            status: true,
            _count: {
              select: {
                invitations: true,
              },
            },
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    // Get all invitations for this document to calculate progress
    const allInvitations = await prisma.documentInvitation.findMany({
      where: { documentId: invitation.documentId },
      select: {
        id: true,
        status: true,
        recipientName: true,
        recipientEmail: true,
        signedAt: true,
      },
    })

    const totalSigners = allInvitations.length
    const completedSigners = allInvitations.filter((inv) => inv.status === "COMPLETED").length
    const pendingSigners = allInvitations.filter((inv) => inv.status === "PENDING").length

    // Mark invitation as viewed if it's still pending
    if (invitation.status === "PENDING") {
      await prisma.documentInvitation.update({
        where: { id: invitation.id },
        data: { status: "VIEWED" },
      })
    }

    const progress = {
      invitation: {
        id: invitation.id,
        status: invitation.status,
        isExpired: invitation.expiresAt < new Date(),
        isSigned: invitation.status === "COMPLETED",
        signedAt: invitation.signedAt,
        recipientName: invitation.recipientName,
        recipientEmail: invitation.recipientEmail,
      },
      document: {
        id: invitation.document.id,
        title: invitation.document.title,
        status: invitation.document.status,
        isCompleted: invitation.document.status === "COMPLETED",
      },
      signingProgress: {
        totalSigners,
        completedSigners,
        pendingSigners,
        progressPercentage: Math.round((completedSigners / totalSigners) * 100),
        allCompleted: completedSigners === totalSigners,
      },
      signers: allInvitations.map((inv) => ({
        id: inv.id,
        name: inv.recipientName,
        email: inv.recipientEmail,
        status: inv.status,
        signedAt: inv.signedAt,
        isSigned: inv.status === "COMPLETED",
      })),
    }

    return NextResponse.json({
      success: true,
      progress,
    })
  } catch (error) {
    console.error("Progress tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
