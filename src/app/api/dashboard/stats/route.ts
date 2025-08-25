import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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

    // Calculate date range for "This Month"
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get user's document statistics
    const [
      totalDocuments,
      pendingSignatures,
      completedDocuments,
      thisMonthDocuments,
      recentActivity,
    ] = await Promise.all([
      // Total documents created by user
      prisma.document.count({
        where: {
          createdById: session.user.id,
        },
      }),

      // Documents with pending signatures
      prisma.document.count({
        where: {
          createdById: session.user.id,
          status: {
            in: ["SENT", "PARTIALLY_SIGNED"],
          },
        },
      }),

      // Completed documents
      prisma.document.count({
        where: {
          createdById: session.user.id,
          status: "COMPLETED",
        },
      }),

      // Documents created this month
      prisma.document.count({
        where: {
          createdById: session.user.id,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Recent activity (last 5 documents with their latest status)
      prisma.document.findMany({
        where: {
          createdById: session.user.id,
        },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          _count: {
            select: {
              signingRequests: true,
              signatures: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
    ])

    const response = NextResponse.json({
      success: true,
      stats: {
        totalDocuments,
        pendingSignatures,
        completedDocuments,
        thisMonthDocuments,
      },
      recentActivity: recentActivity.map((doc) => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        updatedAt: doc.updatedAt.toISOString(),
        signersCount: doc._count.signingRequests,
        signaturesCount: doc._count.signatures,
      })),
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}