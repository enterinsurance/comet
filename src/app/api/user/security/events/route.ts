import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSecurityEvents, getAuditLogs, AuditEventType, AuditSeverity } from "@/lib/audit-logger"
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

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("range") as "last24h" | "last7d" | "last30d" || "last7d"
    const filter = searchParams.get("filter") || "all"

    // Calculate date range
    const now = new Date()
    const startDate = new Date(now)
    
    switch (timeRange) {
      case "last24h":
        startDate.setHours(startDate.getHours() - 24)
        break
      case "last7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "last30d":
        startDate.setDate(startDate.getDate() - 30)
        break
    }

    // Build filter criteria
    let eventTypeFilter: AuditEventType[] | undefined

    switch (filter) {
      case "critical":
        eventTypeFilter = [
          AuditEventType.SUSPICIOUS_ACTIVITY,
          AuditEventType.INVALID_TOKEN_USED,
          AuditEventType.RATE_LIMIT_EXCEEDED,
        ]
        break
      case "failed":
        eventTypeFilter = [
          AuditEventType.LOGIN_FAILED,
          AuditEventType.TOKEN_EXPIRED,
          AuditEventType.INVALID_TOKEN_USED,
        ]
        break
      case "login":
        eventTypeFilter = [
          AuditEventType.USER_LOGIN,
          AuditEventType.LOGIN_FAILED,
          AuditEventType.USER_LOGOUT,
        ]
        break
    }

    // Fetch security events for the user
    const events = await getAuditLogs({
      userId: session.user.id,
      startDate,
      endDate: now,
      eventType: eventTypeFilter?.[0], // getAuditLogs only accepts single eventType
      limit: 100,
    })

    // If we have multiple event types to filter, do it here
    const filteredEvents = eventTypeFilter && eventTypeFilter.length > 1
      ? events.filter(event => eventTypeFilter.includes(event.eventType as AuditEventType))
      : events

    // Calculate stats
    const stats = {
      totalEvents: filteredEvents.length,
      criticalEvents: filteredEvents.filter(e => e.severity === AuditSeverity.CRITICAL).length,
      failedLogins: filteredEvents.filter(e => 
        e.eventType === AuditEventType.LOGIN_FAILED && 
        e.timestamp >= startDate
      ).length,
      activeSessions: 1, // This would be calculated from session data
      lastLogin: filteredEvents
        .filter(e => e.eventType === AuditEventType.USER_LOGIN)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        ?.timestamp || null,
    }

    const response = NextResponse.json({
      success: true,
      events: filteredEvents,
      stats,
      timeRange,
      filter,
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Get security events error:", error)
    return NextResponse.json({ error: "Failed to fetch security events" }, { status: 500 })
  }
}