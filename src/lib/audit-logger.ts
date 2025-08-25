import type { NextRequest } from "next/server"
import { prisma } from "./prisma"

// Audit event types
export enum AuditEventType {
  // Authentication events
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_REGISTRATION = "USER_REGISTRATION",
  LOGIN_FAILED = "LOGIN_FAILED",
  PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_COMPLETE = "PASSWORD_RESET_COMPLETE",

  // Document events
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  DOCUMENT_VIEWED = "DOCUMENT_VIEWED",
  DOCUMENT_DELETED = "DOCUMENT_DELETED",
  DOCUMENT_SHARED = "DOCUMENT_SHARED",
  DOCUMENT_DOWNLOADED = "DOCUMENT_DOWNLOADED",

  // Signature events
  SIGNATURE_REQUEST_SENT = "SIGNATURE_REQUEST_SENT",
  SIGNATURE_REQUEST_VIEWED = "SIGNATURE_REQUEST_VIEWED",
  SIGNATURE_SUBMITTED = "SIGNATURE_SUBMITTED",
  SIGNATURE_REJECTED = "SIGNATURE_REJECTED",
  DOCUMENT_COMPLETED = "DOCUMENT_COMPLETED",
  DOCUMENT_FINALIZED = "DOCUMENT_FINALIZED",

  // Security events
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_TOKEN_USED = "INVALID_TOKEN_USED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  API_KEY_USED = "API_KEY_USED",
  CORS_VIOLATION = "CORS_VIOLATION",

  // Administrative events
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
  BULK_OPERATION = "BULK_OPERATION",
  DATA_EXPORT = "DATA_EXPORT",
}

export enum AuditSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface AuditContext {
  userId?: string
  sessionId?: string
  documentId?: string
  invitationId?: string
  ipAddress?: string
  userAgent?: string
  requestId?: string
  email?: string
  additionalData?: Record<string, any>
}

export interface AuditEvent {
  eventType: AuditEventType
  severity: AuditSeverity
  message: string
  context: AuditContext
  success: boolean
  timestamp: Date
  metadata?: Record<string, any>
}

// Extract request metadata
export function extractRequestMetadata(
  request: NextRequest
): Pick<AuditContext, "ipAddress" | "userAgent" | "requestId"> {
  const headers = request.headers

  return {
    ipAddress:
      headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      "unknown",
    userAgent: headers.get("user-agent") || "unknown",
    requestId:
      headers.get("x-request-id") || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }
}

// Core audit logging function
export async function logAuditEvent(event: Omit<AuditEvent, "timestamp">): Promise<void> {
  const auditEvent: AuditEvent = {
    ...event,
    timestamp: new Date(),
  }

  try {
    // Log to database
    await prisma.auditLog.create({
      data: {
        eventType: auditEvent.eventType,
        severity: auditEvent.severity,
        message: auditEvent.message,
        success: auditEvent.success,
        userId: auditEvent.context.userId,
        sessionId: auditEvent.context.sessionId,
        documentId: auditEvent.context.documentId,
        invitationId: auditEvent.context.invitationId,
        ipAddress: auditEvent.context.ipAddress,
        userAgent: auditEvent.context.userAgent,
        requestId: auditEvent.context.requestId,
        email: auditEvent.context.email,
        metadata: auditEvent.metadata,
        additionalData: auditEvent.context.additionalData,
        timestamp: auditEvent.timestamp,
      },
    })

    // Log to console for development
    if (process.env.NODE_ENV === "development") {
      console.log("[AUDIT]", {
        type: auditEvent.eventType,
        severity: auditEvent.severity,
        message: auditEvent.message,
        success: auditEvent.success,
        user: auditEvent.context.userId,
        ip: auditEvent.context.ipAddress,
        timestamp: auditEvent.timestamp,
      })
    }

    // Send critical events to external monitoring
    if (auditEvent.severity === AuditSeverity.CRITICAL) {
      await sendCriticalAlert(auditEvent)
    }
  } catch (error) {
    console.error("Failed to log audit event:", error)
    // Fallback: always log critical events to console
    if (event.severity === AuditSeverity.CRITICAL) {
      console.error("[CRITICAL AUDIT EVENT]", auditEvent)
    }
  }
}

// Helper functions for common audit events
export async function logUserLogin(
  userId: string,
  email: string,
  request: NextRequest,
  success: boolean
) {
  const metadata = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: success ? AuditEventType.USER_LOGIN : AuditEventType.LOGIN_FAILED,
    severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
    message: success ? `User logged in successfully` : `Failed login attempt`,
    success,
    context: {
      userId: success ? userId : undefined,
      email,
      ...metadata,
    },
  })
}

export async function logDocumentUpload(
  userId: string,
  documentId: string,
  fileName: string,
  fileSize: number,
  request: NextRequest
) {
  const metadata = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: AuditEventType.DOCUMENT_UPLOADED,
    severity: AuditSeverity.LOW,
    message: `Document uploaded: ${fileName}`,
    success: true,
    context: {
      userId,
      documentId,
      ...metadata,
    },
    metadata: {
      fileName,
      fileSize,
    },
  })
}

export async function logSignatureSubmission(
  invitationId: string,
  documentId: string,
  signerEmail: string,
  request: NextRequest
) {
  const metadata = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: AuditEventType.SIGNATURE_SUBMITTED,
    severity: AuditSeverity.MEDIUM,
    message: `Signature submitted for document`,
    success: true,
    context: {
      invitationId,
      documentId,
      email: signerEmail,
      ...metadata,
    },
  })
}

export async function logSecurityEvent(
  eventType: AuditEventType,
  message: string,
  request: NextRequest,
  context: Partial<AuditContext> = {}
) {
  const metadata = extractRequestMetadata(request)

  // Determine severity based on event type
  let severity = AuditSeverity.MEDIUM
  if ([AuditEventType.SUSPICIOUS_ACTIVITY, AuditEventType.INVALID_TOKEN_USED].includes(eventType)) {
    severity = AuditSeverity.HIGH
  }

  await logAuditEvent({
    eventType,
    severity,
    message,
    success: false,
    context: {
      ...context,
      ...metadata,
    },
  })
}

export async function logRateLimitExceeded(
  endpoint: string,
  limit: number,
  request: NextRequest,
  userId?: string
) {
  const metadata = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
    severity: AuditSeverity.MEDIUM,
    message: `Rate limit exceeded for endpoint: ${endpoint}`,
    success: false,
    context: {
      userId,
      ...metadata,
    },
    metadata: {
      endpoint,
      limit,
    },
  })
}

// Send critical alerts to external services
async function sendCriticalAlert(event: AuditEvent) {
  // In a production environment, you would integrate with services like:
  // - Slack notifications
  // - PagerDuty alerts
  // - Email notifications to security team
  // - SIEM systems

  console.error("[CRITICAL ALERT]", {
    type: event.eventType,
    message: event.message,
    context: event.context,
    timestamp: event.timestamp,
  })

  // Example: Send to webhook or monitoring service
  if (process.env.SECURITY_WEBHOOK_URL) {
    try {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert: "Critical Security Event",
          event: event.eventType,
          message: event.message,
          severity: event.severity,
          timestamp: event.timestamp,
          context: event.context,
        }),
      })
    } catch (error) {
      console.error("Failed to send critical alert:", error)
    }
  }
}

// Audit log query helpers
export async function getAuditLogs(filters: {
  userId?: string
  documentId?: string
  eventType?: AuditEventType
  severity?: AuditSeverity
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.documentId) where.documentId = filters.documentId
  if (filters.eventType) where.eventType = filters.eventType
  if (filters.severity) where.severity = filters.severity

  if (filters.startDate || filters.endDate) {
    where.timestamp = {}
    if (filters.startDate) where.timestamp.gte = filters.startDate
    if (filters.endDate) where.timestamp.lte = filters.endDate
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  })
}

export async function getSecurityEvents(timeRange: "last24h" | "last7d" | "last30d" = "last24h") {
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

  return await prisma.auditLog.findMany({
    where: {
      timestamp: { gte: startDate },
      eventType: {
        in: [
          AuditEventType.RATE_LIMIT_EXCEEDED,
          AuditEventType.INVALID_TOKEN_USED,
          AuditEventType.TOKEN_EXPIRED,
          AuditEventType.SUSPICIOUS_ACTIVITY,
          AuditEventType.LOGIN_FAILED,
          AuditEventType.CORS_VIOLATION,
        ],
      },
    },
    orderBy: { timestamp: "desc" },
  })
}
