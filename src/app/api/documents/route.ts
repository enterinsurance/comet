import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause for filtering
    const where = {
      createdById: session.user.id,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { fileName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status: status as any }),
    }

    // Fetch documents with pagination
    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          fileName: true,
          fileSize: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          filePath: true,
          completedDocumentUrl: true,
          finalizedAt: true,
          _count: {
            select: {
              signatures: true,
              signingRequests: true,
              invitations: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    })
  } catch (error) {
    console.error("Fetch documents error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
