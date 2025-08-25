"use client"

import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Send,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SigningRequest {
  id: string
  email: string
  name?: string
  status: "PENDING" | "VIEWED" | "SIGNED" | "EXPIRED" | "DECLINED"
  token: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  signingUrl: string
  isExpired: boolean
  signatureCount: number
  lastSignedAt?: string
  signatures: Array<{
    id: string
    createdAt: string
    page: number
    x: number
    y: number
    width: number
    height: number
  }>
}

interface InvitationSummary {
  total: number
  pending: number
  viewed: number
  signed: number
  expired: number
  declined: number
  totalSignatures: number
}

interface InvitationTrackerProps {
  documentId: string
  documentTitle: string
  onRefresh?: () => void
}

export function InvitationTracker({
  documentId,
  documentTitle,
  onRefresh,
}: InvitationTrackerProps) {
  const [signingRequests, setSigningRequests] = useState<SigningRequest[]>([])
  const [summary, setSummary] = useState<InvitationSummary>({
    total: 0,
    pending: 0,
    viewed: 0,
    signed: 0,
    expired: 0,
    declined: 0,
    totalSignatures: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadSigningRequests = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await fetch(`/api/documents/${documentId}/signing-requests`)

      if (!response.ok) {
        throw new Error("Failed to load signing requests")
      }

      const data = await response.json()
      setSigningRequests(data.signingRequests || [])
      setSummary(data.summary || {})
    } catch (error) {
      console.error("Error loading signing requests:", error)
      toast.error("Failed to load invitation status")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadSigningRequests()
  }, [documentId])

  const handleRefresh = () => {
    loadSigningRequests(false)
    onRefresh?.()
  }

  const copySigningUrl = (url: string, email: string) => {
    navigator.clipboard.writeText(url)
    toast.success(`Copied signing URL for ${email}`)
  }

  const deleteSigningRequest = async (requestId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete the invitation for ${email}?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/documents/${documentId}/signing-requests?requestId=${requestId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Failed to delete signing request")
      }

      toast.success(`Deleted invitation for ${email}`)
      loadSigningRequests(false)
    } catch (error) {
      console.error("Error deleting signing request:", error)
      toast.error("Failed to delete invitation")
    }
  }

  const getStatusIcon = (status: string, isExpired: boolean) => {
    if (isExpired && status !== "SIGNED") {
      return <XCircle className="h-4 w-4 text-red-500" />
    }

    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "VIEWED":
        return <Eye className="h-4 w-4 text-blue-500" />
      case "SIGNED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "DECLINED":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired && status !== "SIGNED") {
      return <Badge variant="destructive">Expired</Badge>
    }

    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>
      case "VIEWED":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            Viewed
          </Badge>
        )
      case "SIGNED":
        return (
          <Badge variant="default" className="bg-green-600">
            Signed
          </Badge>
        )
      case "DECLINED":
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <div className="text-muted-foreground">Loading invitation status...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Invitation Status</span>
              </CardTitle>
              <CardDescription>Track signing invitations for "{documentTitle}"</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-blue-600" />
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{summary.signed}</div>
              <div className="text-sm text-muted-foreground">Signed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {summary.pending + summary.viewed}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="text-2xl font-bold text-red-600">
                {summary.expired + summary.declined}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      {signingRequests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invitations ({signingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-full">
                      <User className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{request.name || request.email}</div>
                      {request.name && (
                        <div className="text-sm text-muted-foreground">{request.email}</div>
                      )}

                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Sent {formatDate(request.createdAt)}</span>
                        </div>

                        {request.lastSignedAt && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Signed {formatDate(request.lastSignedAt)}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Expires {formatDate(request.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status, request.isExpired)}
                      {getStatusBadge(request.status, request.isExpired)}
                    </div>

                    {request.signatureCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {request.signatureCount} signature{request.signatureCount !== 1 ? "s" : ""}
                      </Badge>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => copySigningUrl(request.signingUrl, request.email)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Signing URL
                        </DropdownMenuItem>

                        {request.status !== "SIGNED" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteSigningRequest(request.id, request.email)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Invitation
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="font-medium text-muted-foreground">No invitations sent yet</div>
            <div className="text-sm text-muted-foreground mt-1">
              Send signing invitations to start collecting signatures
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
