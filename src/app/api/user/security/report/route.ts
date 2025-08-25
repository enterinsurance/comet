import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAuditLogs } from "@/lib/audit-logger"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, createRateLimitHeaders, createRateLimitResponse } from "@/lib/rate-limit"

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

    // Generate comprehensive security report
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            signatures: true,
            sessions: true,
          },
        },
      },
    })

    // Get audit logs for the last 30 days
    const auditLogs = await getAuditLogs({
      userId: session.user.id,
      startDate: thirtyDaysAgo,
      endDate: now,
      limit: 1000,
    })

    // Get current sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expiresAt: {
          gte: now,
        },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    // Generate security metrics
    const securityMetrics = {
      loginAttempts: auditLogs.filter(log => log.eventType === "USER_LOGIN").length,
      failedLogins: auditLogs.filter(log => log.eventType === "LOGIN_FAILED").length,
      documentsAccessed: auditLogs.filter(log => log.eventType === "DOCUMENT_VIEWED").length,
      signaturesCreated: auditLogs.filter(log => log.eventType === "SIGNATURE_SUBMITTED").length,
      securityEvents: auditLogs.filter(log => 
        ["RATE_LIMIT_EXCEEDED", "INVALID_TOKEN_USED", "SUSPICIOUS_ACTIVITY"].includes(log.eventType)
      ).length,
    }

    // Security recommendations
    const recommendations = []
    
    if (securityMetrics.failedLogins > 5) {
      recommendations.push("Consider enabling two-factor authentication due to multiple failed login attempts")
    }
    
    if (!user?.emailVerified) {
      recommendations.push("Verify your email address to improve account security")
    }
    
    if (activeSessions.length > 3) {
      recommendations.push("You have multiple active sessions. Consider revoking unused sessions")
    }

    // Generate report
    const securityReport = {
      reportGenerated: now.toISOString(),
      reportPeriod: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString(),
      },
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        emailVerified: user?.emailVerified,
        accountCreated: user?.createdAt,
        totalDocuments: user?._count.documents,
        totalSignatures: user?._count.signatures,
      },
      security: {
        activeSessions: activeSessions.length,
        totalAuditEvents: auditLogs.length,
        metrics: securityMetrics,
        recommendations,
      },
      auditEvents: auditLogs.map(log => ({
        eventType: log.eventType,
        severity: log.severity,
        message: log.message,
        success: log.success,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        metadata: log.metadata,
      })),
      activeSessions: activeSessions.map(s => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    }

    // Return as JSON download
    const response = new NextResponse(JSON.stringify(securityReport, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="security-report-${user?.email}-${now.toISOString().split("T")[0]}.json"`,
      },
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Generate security report error:", error)
    return NextResponse.json({ error: "Failed to generate security report" }, { status: 500 })
  }
}