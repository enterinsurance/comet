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

    // Get comprehensive statistics in a single optimized query
    const [
      allSigningRequests,
      documentsWithRequests,
      recentRequests,
    ] = await Promise.all([
      // Get all signing requests for the user's documents
      prisma.signingRequest.findMany({
        where: {
          document: {
            createdById: session.user.id,
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          signedAt: true,
          token: true,
          document: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      // Get count of documents with signing requests
      prisma.document.count({
        where: {
          createdById: session.user.id,
          signingRequests: {
            some: {},
          },
        },
      }),

      // Get recent signing requests (last 10)
      prisma.signingRequest.findMany({
        where: {
          document: {
            createdById: session.user.id,
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          token: true,
          document: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ])

    // Calculate statistics
    const uniqueEmails = new Set<string>()
    const now = new Date()
    
    let pendingRequests = 0
    let completedRequests = 0
    let viewedRequests = 0
    let expiredRequests = 0

    allSigningRequests.forEach((request) => {
      uniqueEmails.add(request.email.toLowerCase())
      
      const isExpired = request.expiresAt && new Date(request.expiresAt) < now
      
      if (isExpired) {
        expiredRequests++
      } else {
        switch (request.status) {
          case "PENDING":
            pendingRequests++
            break
          case "VIEWED":
            viewedRequests++
            break
          case "COMPLETED":
            completedRequests++
            break
        }
      }
    })

    // Process recent requests with signing URLs
    const recentRequestsWithUrls = recentRequests.map((request) => ({
      id: request.id,
      email: request.email,
      name: request.name,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      expiresAt: request.expiresAt?.toISOString(),
      isExpired: request.expiresAt ? new Date(request.expiresAt) < now : false,
      signingUrl: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/sign/${request.token}`,
      document: {
        id: request.document.id,
        title: request.document.title,
        status: request.document.status,
      },
    }))

    const stats = {
      totalRecipients: uniqueEmails.size,
      totalRequests: allSigningRequests.length,
      pendingRequests,
      viewedRequests,
      completedRequests,
      expiredRequests,
      documentsWithRequests,
    }

    const response = NextResponse.json({
      success: true,
      stats,
      recentRequests: recentRequestsWithUrls,
      allRequests: allSigningRequests.map((request) => ({
        id: request.id,
        email: request.email,
        name: request.name,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        expiresAt: request.expiresAt?.toISOString(),
        signedAt: request.signedAt?.toISOString(),
        isExpired: request.expiresAt ? new Date(request.expiresAt) < now : false,
        signingUrl: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/sign/${request.token}`,
        signatureCount: request.status === "COMPLETED" ? 1 : 0,
        document: {
          id: request.document.id,
          title: request.document.title,
          status: request.document.status,
        },
      })),
    })

    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Recipients stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipients statistics" },
      { status: 500 }
    )
  }
}