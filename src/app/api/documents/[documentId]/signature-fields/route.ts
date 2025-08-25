import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const signatureFieldSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  page: z.number().int().min(1),
  label: z.string().optional(),
  required: z.boolean().default(true),
  signerEmail: z.string().email().optional(),
})

const updateSignatureFieldsSchema = z.object({
  signatureFields: z.array(signatureFieldSchema),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Get signature fields for the document
    const signatureFields = await prisma.signatureField.findMany({
      where: {
        documentId: documentId,
      },
      orderBy: [{ page: "asc" }, { y: "asc" }, { x: "asc" }],
    })

    return NextResponse.json({ signatureFields })
  } catch (error) {
    console.error("Error fetching signature fields:", error)
    return NextResponse.json({ error: "Failed to fetch signature fields" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const body = await request.json()
    const { signatureFields } = updateSignatureFieldsSchema.parse(body)

    // Use a transaction to update signature fields
    await prisma.$transaction(async (tx) => {
      // Delete existing signature fields for this document
      await tx.signatureField.deleteMany({
        where: {
          documentId: documentId,
        },
      })

      // Create new signature fields
      if (signatureFields.length > 0) {
        await tx.signatureField.createMany({
          data: signatureFields.map((field) => ({
            ...field,
            documentId: documentId,
          })),
        })
      }
    })

    // Fetch and return updated signature fields
    const updatedSignatureFields = await prisma.signatureField.findMany({
      where: {
        documentId: documentId,
      },
      orderBy: [{ page: "asc" }, { y: "asc" }, { x: "asc" }],
    })

    return NextResponse.json({ signatureFields: updatedSignatureFields })
  } catch (error) {
    console.error("Error updating signature fields:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid signature field data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to update signature fields" }, { status: 500 })
  }
}
