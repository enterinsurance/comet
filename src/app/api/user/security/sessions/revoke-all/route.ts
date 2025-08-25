import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  AuditEventType,
  AuditSeverity,
  extractRequestMetadata,
  logAuditEvent,
} from "@/lib/audit-logger"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, createRateLimitHeaders, createRateLimitResponse } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
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

    // Get count of sessions to be revoked (for audit log)
    const sessionCount = await prisma.session.count({
      where: {
        userId: session.user.id,
        expiresAt: {
          gte: new Date(),
        },
      },
    })

    // Revoke all sessions for the user (including current session)
    const revokedSessions = await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
      },
    })

    // Log audit event
    await logAuditEvent({
      eventType: AuditEventType.SETTINGS_CHANGED,
      severity: AuditSeverity.HIGH,
      message: "All sessions revoked",
      success: true,
      context: {
        userId: session.user.id,
        sessionId: session.session?.id,
        email: session.user.email,
        ...extractRequestMetadata(request),
      },
      metadata: {
        revokedSessionCount: revokedSessions.count,
        totalSessionCount: sessionCount,
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "All sessions revoked successfully",
      revokedCount: revokedSessions.count,
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Revoke all sessions error:", error)
    return NextResponse.json({ error: "Failed to revoke all sessions" }, { status: 500 })
  }
}
