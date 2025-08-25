import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isTokenExpired } from "@/lib/tokens"

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
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        createdById: session.user.id,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Get signing requests for this document
    const signingRequests = await prisma.signingRequest.findMany({
      where: {
        documentId: documentId,
      },
      include: {
        signatures: {
          select: {
            id: true,
            createdAt: true,
            page: true,
            x: true,
            y: true,
            width: true,
            height: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Add computed fields
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"

    const requestsWithStatus = signingRequests.map((request) => ({
      ...request,
      signingUrl: `${baseUrl}/sign/${request.token}`,
      isExpired: isTokenExpired(request.expiresAt),
      signatureCount: request.signatures.length,
      lastSignedAt:
        request.signatures.length > 0
          ? new Date(Math.max(...request.signatures.map((s) => new Date(s.createdAt).getTime())))
          : null,
    }))

    return NextResponse.json({
      signingRequests: requestsWithStatus,
      summary: {
        total: signingRequests.length,
        pending: signingRequests.filter((sr) => sr.status === "PENDING").length,
        viewed: signingRequests.filter((sr) => sr.status === "VIEWED").length,
        signed: signingRequests.filter((sr) => sr.status === "COMPLETED").length,
        expired: requestsWithStatus.filter((sr) => sr.isExpired).length,
        declined: signingRequests.filter((sr) => sr.status === "DECLINED").length,
        totalSignatures: signingRequests.reduce((sum, sr) => sum + sr.signatures.length, 0),
      },
    })
  } catch (error) {
    console.error("Get signing requests error:", error)
    return NextResponse.json({ error: "Failed to fetch signing requests" }, { status: 500 })
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("requestId")

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    // Verify document ownership and request exists
    const signingRequest = await prisma.signingRequest.findFirst({
      where: {
        id: requestId,
        documentId: documentId,
        document: {
          createdById: session.user.id,
        },
      },
    })

    if (!signingRequest) {
      return NextResponse.json({ error: "Signing request not found" }, { status: 404 })
    }

    // Don't allow deletion of completed requests
    if (signingRequest.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot delete a completed request" }, { status: 400 })
    }

    // Delete the signing request (will cascade delete signatures)
    await prisma.signingRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete signing request error:", error)
    return NextResponse.json({ error: "Failed to delete signing request" }, { status: 500 })
  }
}
