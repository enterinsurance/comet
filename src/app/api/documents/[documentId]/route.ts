import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Find the document and ensure it belongs to the user
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        createdById: session.user.id, // Ensure user owns the document
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    // Delete the file from Vercel Blob
    try {
      await del(document.filePath)
    } catch (error) {
      console.warn("Failed to delete file from blob storage:", error)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete the document and related records from database
    // Cascading deletes should handle signatures and signing requests
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
