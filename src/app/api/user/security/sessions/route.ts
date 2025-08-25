import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logAuditEvent, AuditEventType, AuditSeverity, extractRequestMetadata } from "@/lib/audit-logger"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, createRateLimitHeaders, createRateLimitResponse } from "@/lib/rate-limit"

const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
})

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await checkRateLimit("api")
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

    // Get current session token to identify current session
    const currentSessionToken = session.session?.token

    // Fetch all active sessions for the user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expiresAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        token: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Mark current session
    const sessionsWithCurrentFlag = sessions.map(s => ({
      ...s,
      isCurrent: s.token === currentSessionToken,
    }))

    const response = NextResponse.json({
      success: true,
      sessions: sessionsWithCurrentFlag,
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Get sessions error:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await checkRateLimit("api")
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

    // Parse request body
    const body = await request.json()
    const { sessionId } = revokeSessionSchema.parse(body)

    // Verify the session belongs to the current user
    const sessionToRevoke = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    })

    if (!sessionToRevoke) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Don't allow revoking current session through this endpoint
    if (sessionToRevoke.token === session.session?.token) {
      return NextResponse.json({ error: "Cannot revoke current session" }, { status: 400 })
    }

    // Revoke the session
    await prisma.session.delete({
      where: { id: sessionId },
    })

    // Log audit event
    await logAuditEvent({
      eventType: AuditEventType.SETTINGS_CHANGED,
      severity: AuditSeverity.MEDIUM,
      message: "Session revoked",
      success: true,
      context: {
        userId: session.user.id,
        sessionId: session.session?.id,
        email: session.user.email,
        ...extractRequestMetadata(request),
      },
      metadata: {
        revokedSessionId: sessionId,
        revokedSessionIp: sessionToRevoke.ipAddress,
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Revoke session error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 })
  }
}