import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf"]

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const uniqueFileName = `${session.user.id}-${timestamp}.${fileExtension}`

    // Upload to Vercel Blob
    const blob = await put(uniqueFileName, file, {
      access: "public",
    })

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        title: file.name,
        fileName: file.name,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
        createdById: session.user.id,
      },
    })

    return NextResponse.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      fileSize: document.fileSize,
      status: document.status,
      createdAt: document.createdAt,
      url: document.filePath,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
