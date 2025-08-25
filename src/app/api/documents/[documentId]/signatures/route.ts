import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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

    // Verify document ownership
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        createdById: session.user.id,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or unauthorized" }, { status: 404 })
    }

    // Get all completed signatures for this document
    const signatures = await prisma.documentInvitation.findMany({
      where: {
        documentId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        recipientName: true,
        recipientEmail: true,
        signerName: true,
        signedAt: true,
        signatureUrl: true,
        signerTitle: true,
        signerNotes: true,
        signerIpAddress: true,
      },
      orderBy: {
        signedAt: "asc",
      },
    })

    const formattedSignatures = signatures.map((signature) => ({
      id: signature.id,
      signerName: signature.signerName || signature.recipientName,
      recipientName: signature.recipientName,
      recipientEmail: signature.recipientEmail,
      signedAt: signature.signedAt?.toISOString(),
      signatureUrl: signature.signatureUrl,
      signerTitle: signature.signerTitle,
      signerNotes: signature.signerNotes,
      signerIpAddress: signature.signerIpAddress,
    }))

    return NextResponse.json({
      success: true,
      signatures: formattedSignatures,
      totalSignatures: formattedSignatures.length,
    })
  } catch (error) {
    console.error("Get signatures error:", error)
    return NextResponse.json({ error: "Failed to fetch signatures" }, { status: 500 })
  }
}
