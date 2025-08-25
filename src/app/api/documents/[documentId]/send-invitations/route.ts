import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { sendBulkSigningInvitations } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, createRateLimitHeaders, createRateLimitResponse } from "@/lib/rate-limit"
import { calculateTokenExpiration, generateSigningToken } from "@/lib/tokens"

const signerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  message: z.string().optional(),
  assignedFieldIds: z.array(z.string()).default([]),
})

const sendInvitationsSchema = z.object({
  signers: z.array(signerSchema).min(1, "At least one signer is required"),
  expiresInDays: z.number().min(1).max(30).default(7),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // Check rate limit
    const rateLimit = await checkRateLimit("email")
    if (!rateLimit.success) {
      return createRateLimitResponse()
    }

    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { documentId } = await params

    // Verify document ownership and get document details
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        createdById: session.user.id,
      },
      include: {
        signatureFields: true,
        createdBy: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { signers, expiresInDays } = sendInvitationsSchema.parse(body)

    // Validate that document is ready for signing
    if (document.status !== "SENT") {
      return NextResponse.json(
        { error: "Document must be prepared for signing first" },
        { status: 400 }
      )
    }

    // Check if document has signature fields
    if (document.signatureFields.length === 0) {
      return NextResponse.json(
        { error: "Document must have at least one signature field" },
        { status: 400 }
      )
    }

    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
    const expirationDate = calculateTokenExpiration(expiresInDays)

    // Create signing requests and prepare invitations
    const invitations = []
    const signingRequests = []

    for (const signer of signers) {
      // Generate secure token for this signer
      const token = generateSigningToken()

      // Create signing request in database
      const signingRequest = await prisma.signingRequest.create({
        data: {
          documentId: documentId,
          email: signer.email,
          name: signer.name,
          token: token,
          expiresAt: expirationDate,
          status: "PENDING",
        },
      })

      signingRequests.push(signingRequest)

      // Prepare invitation email
      invitations.push({
        to: signer.email,
        recipientName: signer.name,
        senderName: document.createdBy.name || document.createdBy.email,
        documentTitle: document.title,
        signingUrl: `${baseUrl}/sign/${token}`,
        expiresAt: expirationDate,
        message: signer.message,
      })
    }

    // Send invitation emails
    const emailResults = await sendBulkSigningInvitations(invitations)

    // Count successful and failed emails
    const successfulEmails = emailResults.filter((result) => result.success).length
    const failedEmails = emailResults.filter((result) => !result.success)

    // Update document status if needed
    if (successfulEmails > 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "SENT",
          updatedAt: new Date(),
        },
      })
    }

    // Prepare response
    const response = {
      success: true,
      totalInvitations: signers.length,
      successfulEmails,
      failedEmails: failedEmails.length,
      signingRequests: signingRequests.map((sr) => ({
        id: sr.id,
        email: sr.email,
        name: sr.name,
        status: sr.status,
        expiresAt: sr.expiresAt,
        signingUrl: `${baseUrl}/sign/${sr.token}`,
      })),
      emailFailures: failedEmails,
    }

    const responseObj = NextResponse.json(response)

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      responseObj.headers.set(key, value)
    })

    return responseObj
  } catch (error) {
    console.error("Send invitations error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid invitation data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to send invitations" }, { status: 500 })
  }
}
