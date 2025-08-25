import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateDocumentSchema = z.object({
  status: z
    .enum(["DRAFT", "SENT", "PARTIALLY_SIGNED", "COMPLETED", "EXPIRED", "CANCELLED"])
    .optional(),
  title: z.string().min(1).optional(),
})

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

    // Find the document and ensure it belongs to the user
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        createdById: session.user.id, // Ensure user owns the document
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        filePath: true,
        _count: {
          select: {
            signatures: true,
            signingRequests: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Fetch document error:", error)
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

export async function PATCH(
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

    // Parse request body
    const body = await request.json()
    const { status, title } = updateDocumentSchema.parse(body)

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

    // Update the document
    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        ...(status && { status }),
        ...(title && { title }),
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        filePath: true,
        _count: {
          select: {
            signatures: true,
            signingRequests: true,
          },
        },
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("Update document error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid document data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
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
