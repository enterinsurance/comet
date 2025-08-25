"use client"

import { CheckCircle, Clock, FileText, Mail, MoreHorizontal, Users, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSession } from "@/lib/auth-client"

interface Document {
  id: string
  title: string
  status: string
  createdAt: string
  _count: {
    signingRequests: number
  }
}

interface RecentSigningRequest {
  id: string
  email: string
  name?: string
  status: string
  createdAt: string
  document: {
    title: string
  }
}

interface DashboardStats {
  totalRecipients: number
  pendingRequests: number
  completedRequests: number
  totalDocuments: number
}

export default function RecipientsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalRecipients: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalDocuments: 0,
  })
  const [recentRequests, setRecentRequests] = useState<RecentSigningRequest[]>([])
  const [documentsWithRequests, setDocumentsWithRequests] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) return

    const fetchData = async () => {
      try {
        // Fetch documents with signing requests
        const documentsResponse = await fetch("/api/documents")
        const documentsData = await documentsResponse.json()

        if (documentsData.success) {
          const docsWithRequests = documentsData.documents.filter(
            (doc: Document) => doc._count.signingRequests > 0
          )
          setDocumentsWithRequests(docsWithRequests)

          // Calculate stats from documents
          let totalRequests = 0
          let pendingCount = 0
          let completedCount = 0
          const uniqueEmails = new Set<string>()

          // For each document, fetch its signing requests to get detailed stats
          for (const doc of docsWithRequests) {
            const requestsResponse = await fetch(`/api/documents/${doc.id}/signing-requests`)
            const requestsData = await requestsResponse.json()

            if (requestsData.signingRequests) {
              requestsData.signingRequests.forEach((req: any) => {
                uniqueEmails.add(req.email.toLowerCase())
                totalRequests++

                if (req.status === "PENDING" || req.status === "VIEWED") {
                  pendingCount++
                } else if (req.status === "COMPLETED") {
                  completedCount++
                }
              })
            }
          }

          setStats({
            totalRecipients: uniqueEmails.size,
            pendingRequests: pendingCount,
            completedRequests: completedCount,
            totalDocuments: docsWithRequests.length,
          })

          // Get recent requests from the first few documents
          const recentRequestsPromises = docsWithRequests.slice(0, 3).map(async (doc: Document) => {
            const response = await fetch(`/api/documents/${doc.id}/signing-requests`)
            const data = await response.json()

            return (
              data.signingRequests?.map((req: any) => ({
                ...req,
                document: { title: doc.title },
              })) || []
            )
          })

          const allRecentRequests = (await Promise.all(recentRequestsPromises))
            .flat()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)

          setRecentRequests(allRecentRequests)
        }
      } catch (error) {
        console.error("Failed to fetch recipients data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [session])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "PENDING":
      case "VIEWED":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "EXPIRED":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "PENDING":
      case "VIEWED":
        return "secondary"
      case "EXPIRED":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
          <p className="text-muted-foreground">Loading recipient data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
          <p className="text-muted-foreground">
            Manage signing recipients and track invitation progress
          </p>
        </div>
        <Button onClick={() => (window.location.href = "/dashboard/recipients/requests")}>
          <Mail className="h-4 w-4 mr-2" />
          View All Requests
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipients}</div>
            <p className="text-xs text-muted-foreground">Unique email addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting signatures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">Successfully signed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">With signing requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Signing Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signing Requests</CardTitle>
            <CardDescription>Latest invitation activity across all documents</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center space-x-4">
                    {getStatusIcon(request.status)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{request.name || request.email}</p>
                      <p className="text-xs text-muted-foreground">{request.document.title}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(request.status)} className="text-xs">
                      {request.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => (window.location.href = "/dashboard/recipients/requests")}
                >
                  View All Requests
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No signing requests yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents with Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>Documents with Recipients</CardTitle>
            <CardDescription>Documents that have signing invitations</CardDescription>
          </CardHeader>
          <CardContent>
            {documentsWithRequests.length > 0 ? (
              <div className="space-y-4">
                {documentsWithRequests.slice(0, 5).map((document) => (
                  <div key={document.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{document.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {document._count.signingRequests} recipient
                        {document._count.signingRequests !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/documents/${document.id}`}>View Document</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/dashboard/documents">View All Documents</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No documents with recipients yet</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/dashboard/documents">Upload Document</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
