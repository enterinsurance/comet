import { hash, verify } from "@node-rs/argon2"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  AuditEventType,
  AuditSeverity,
  extractRequestMetadata,
  logAuditEvent,
} from "@/lib/audit-logger"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, createRateLimitHeaders, createRateLimitResponse } from "@/lib/rate-limit"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
})

export async function PUT(request: NextRequest) {
  try {
    // Check rate limit (more restrictive for password changes)
    const rateLimit = await checkRateLimit("auth")
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
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Get user's current password hash from the accounts table (Better Auth structure)
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential", // Better Auth uses "credential" for password accounts
      },
    })

    if (!account?.password) {
      return NextResponse.json(
        {
          error: "No password set for this account or account uses social login",
        },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verify(account.password, currentPassword)
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await logAuditEvent({
        eventType: AuditEventType.LOGIN_FAILED,
        severity: AuditSeverity.MEDIUM,
        message: "Failed password change attempt - incorrect current password",
        success: false,
        context: {
          userId: session.user.id,
          email: session.user.email,
          ...extractRequestMetadata(request),
        },
      })

      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await hash(newPassword)

    // Update password
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedNewPassword },
    })

    // Log successful password change
    await logAuditEvent({
      eventType: AuditEventType.SETTINGS_CHANGED,
      severity: AuditSeverity.MEDIUM,
      message: "Password changed successfully",
      success: true,
      context: {
        userId: session.user.id,
        sessionId: session.session?.id,
        email: session.user.email,
        ...extractRequestMetadata(request),
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Change password error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid password data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
