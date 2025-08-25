import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { sendSigningInvitation, sendCompletionNotification } from "@/lib/email"

const testEmailSchema = z.object({
  type: z.enum(["invitation", "completion"]),
  to: z.string().email(),
  recipientName: z.string().optional(),
  senderName: z.string().default("Test Sender"),
  documentTitle: z.string().default("Test Document"),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { type, to, recipientName, senderName, documentTitle } = testEmailSchema.parse(body)

    if (type === "invitation") {
      const result = await sendSigningInvitation({
        to,
        recipientName,
        senderName,
        documentTitle,
        signingUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/sign/test-token`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        message: "This is a test invitation email from the Comet Document Signing system.",
      })

      return NextResponse.json({
        success: true,
        type: "invitation",
        messageId: result.messageId,
      })
    }

    if (type === "completion") {
      const result = await sendCompletionNotification({
        to,
        recipientName: recipientName || "Test Recipient",
        documentTitle,
        signerName: "Test Signer",
        completedAt: new Date(),
        totalSignatures: 2,
        completedSignatures: 2,
        downloadUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/documents/test/download`,
      })

      return NextResponse.json({
        success: true,
        type: "completion",
        messageId: result.messageId,
      })
    }

    return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
  } catch (error) {
    console.error("Test email error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to send test email", message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    )
  }
}