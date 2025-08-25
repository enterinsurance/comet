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

    // Get document - check if user has access (owner or was invited to sign)
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { createdById: session.user.id }, // Document owner
          {
            invitations: {
              some: {
                recipientEmail: session.user.email,
                status: "COMPLETED", // Only completed signers can download
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        completedDocumentUrl: true,
        finalizedAt: true,
        createdById: true,
        invitations: {
          select: {
            recipientEmail: true,
            status: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    // Check if document is completed and has a final PDF
    if (document.status !== "COMPLETED" || !document.completedDocumentUrl) {
      return NextResponse.json(
        { error: "Document is not yet completed or final PDF is not available" },
        { status: 400 }
      )
    }

    // Fetch the file from Vercel Blob
    const response = await fetch(document.completedDocumentUrl)

    if (!response.ok) {
      console.error(`Failed to fetch document from blob storage: ${response.statusText}`)
      return NextResponse.json({ error: "Failed to retrieve document file" }, { status: 500 })
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer()

    // Generate filename for download
    const sanitizedTitle = document.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_")
    const filename = `${sanitizedTitle}_signed.pdf`

    // Create download response with proper headers
    const downloadResponse = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    // Log the download for audit purposes
    console.log(
      `Document ${documentId} downloaded by user ${session.user.id} (${session.user.email})`
    )

    return downloadResponse
  } catch (error) {
    console.error("Document download error:", error)
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
  }
}

/**
 * HEAD method to check if document is available for download without fetching the full file
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return new NextResponse(null, { status: 401 })
    }

    const { documentId } = await params

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { createdById: session.user.id },
          {
            invitations: {
              some: {
                recipientEmail: session.user.email,
                status: "COMPLETED",
              },
            },
          },
        ],
      },
      select: {
        status: true,
        completedDocumentUrl: true,
      },
    })

    if (!document || document.status !== "COMPLETED" || !document.completedDocumentUrl) {
      return new NextResponse(null, { status: 404 })
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
      },
    })
  } catch (error) {
    console.error("Document HEAD check error:", error)
    return new NextResponse(null, { status: 500 })
  }
}
