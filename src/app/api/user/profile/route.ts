import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logAuditEvent, AuditEventType, AuditSeverity, extractRequestMetadata } from "@/lib/audit-logger"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, createRateLimitHeaders, createRateLimitResponse } from "@/lib/rate-limit"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
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

    // Fetch user profile with counts
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            signatures: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const response = NextResponse.json({
      success: true,
      profile,
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { name, email } = updateProfileSchema.parse(body)

    // Check if email is being changed and if it's already in use
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
    }

    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        emailVerified: email === session.user.email ? undefined : false, // Reset verification if email changed
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            signatures: true,
          },
        },
      },
    })

    // Log audit event
    await logAuditEvent({
      eventType: AuditEventType.SETTINGS_CHANGED,
      severity: AuditSeverity.LOW,
      message: "User profile updated",
      success: true,
      context: {
        userId: session.user.id,
        email: session.user.email,
        ...extractRequestMetadata(request),
      },
      metadata: {
        changedFields: {
          name: name !== session.user.name,
          email: email !== session.user.email,
        },
      },
    })

    const response = NextResponse.json({
      success: true,
      profile: updatedProfile,
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Update profile error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid profile data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
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

    // Log audit event before deletion
    await logAuditEvent({
      eventType: AuditEventType.USER_ROLE_CHANGED,
      severity: AuditSeverity.HIGH,
      message: "User account deletion initiated",
      success: true,
      context: {
        userId: session.user.id,
        email: session.user.email,
        ...extractRequestMetadata(request),
      },
    })

    // Delete user account and all related data (cascading deletes handled by Prisma schema)
    await prisma.user.delete({
      where: { id: session.user.id },
    })

    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}