"use client"

import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Mail,
  MoreHorizontal,
  Search,
  Trash2,
  User,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "@/lib/auth-client"

interface SigningRequest {
  id: string
  email: string
  name?: string
  status: string
  token: string
  createdAt: string
  expiresAt?: string
  signedAt?: string
  signingUrl: string
  isExpired: boolean
  signatureCount: number
  document: {
    id: string
    title: string
    status: string
  }
}

interface Document {
  id: string
  title: string
  status: string
  _count: {
    signingRequests: number
  }
}

type StatusFilter = "all" | "pending" | "completed" | "expired" | "viewed"
type SortField = "createdAt" | "email" | "status" | "document"
type SortDirection = "asc" | "desc"

export default function SigningRequestsPage() {
  const { data: session } = useSession()
  const [allRequests, setAllRequests] = useState<SigningRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<SigningRequest[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    viewed: 0,
    completed: 0,
    expired: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [documentFilter, setDocumentFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  useEffect(() => {
    if (!session?.user) return

    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/recipients-stats")
        const data = await response.json()

        if (data.success) {
          setAllRequests(data.allRequests)
          setFilteredRequests(data.allRequests)
          
          // Extract unique documents for the filter dropdown
          const uniqueDocs = data.allRequests
            .reduce((acc: Document[], request: any) => {
              const existingDoc = acc.find(d => d.id === request.document.id)
              if (!existingDoc) {
                acc.push({
                  id: request.document.id,
                  title: request.document.title,
                  status: request.document.status,
                  _count: { signingRequests: 1 }
                })
              } else {
                existingDoc._count.signingRequests++
              }
              return acc
            }, [])
          
          setDocuments(uniqueDocs)
          
          // Set statistics from API
          setStats({
            total: data.stats.totalRequests,
            pending: data.stats.pendingRequests,
            viewed: data.stats.viewedRequests,
            completed: data.stats.completedRequests,
            expired: data.stats.expiredRequests,
          })
        }
      } catch (error) {
        console.error("Failed to fetch signing requests:", error)
        toast.error("Failed to load signing requests")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [session])

  // Apply filters and sorting
  useEffect(() => {
    const filtered = allRequests.filter((request) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.document.title.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "expired" && request.isExpired) ||
        (statusFilter !== "expired" && request.status.toLowerCase() === statusFilter)

      // Document filter
      const matchesDocument = documentFilter === "all" || request.document.id === documentFilter

      return matchesSearch && matchesStatus && matchesDocument
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "email":
          aValue = a.email
          bValue = b.email
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "document":
          aValue = a.document.title
          bValue = b.document.title
          break
        case "createdAt":
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredRequests(filtered)
  }, [allRequests, searchTerm, statusFilter, documentFilter, sortField, sortDirection])

  const getStatusIcon = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return <XCircle className="h-4 w-4 text-red-600" />
    }

    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "VIEWED":
        return <Mail className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return (
        <Badge variant="destructive" className="text-xs">
          expired
        </Badge>
      )
    }

    const variant =
      status === "COMPLETED" ? "default" : status === "VIEWED" ? "secondary" : "outline"

    return (
      <Badge variant={variant} className="text-xs">
        {status.toLowerCase()}
      </Badge>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const copySigningUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("Signing URL copied to clipboard")
  }

  const handleDeleteRequest = async (requestId: string, documentId: string) => {
    try {
      const response = await fetch(
        `/api/documents/${documentId}/signing-requests?requestId=${requestId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete request")
      }

      // Remove from local state
      setAllRequests((prev) => prev.filter((req) => req.id !== requestId))
      toast.success("Signing request deleted")
    } catch (error) {
      console.error("Failed to delete signing request:", error)
      toast.error("Failed to delete signing request")
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Signing Requests</h1>
          <p className="text-muted-foreground">Loading signing requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Signing Requests</h1>
          <p className="text-muted-foreground">
            View and manage all signing invitations across your documents
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/recipients">
            <User className="h-4 w-4 mr-2" />
            Recipients Overview
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewed</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Document</label>
              <Select value={documentFilter} onValueChange={setDocumentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort</label>
              <Select
                value={`${sortField}-${sortDirection}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split("-") as [SortField, SortDirection]
                  setSortField(field)
                  setSortDirection(direction)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="email-asc">Email A-Z</SelectItem>
                  <SelectItem value="email-desc">Email Z-A</SelectItem>
                  <SelectItem value="status-asc">Status A-Z</SelectItem>
                  <SelectItem value="document-asc">Document A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Signing Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>All signing invitations sent across your documents</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                      <div className="flex items-center space-x-2">
                        <span>Recipient</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("document")}>
                      <div className="flex items-center space-x-2">
                        <span>Document</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                      <div className="flex items-center space-x-2">
                        <span>Sent</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.name || request.email}</div>
                          {request.name && (
                            <div className="text-sm text-muted-foreground">{request.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/documents/${request.document.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {request.document.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status, request.isExpired)}
                          {getStatusBadge(request.status, request.isExpired)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.expiresAt && (
                          <div className="text-sm">
                            {new Date(request.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => copySigningUrl(request.signingUrl)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Signing URL
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={request.signingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Signing Page
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/documents/${request.document.id}`}>
                                View Document
                              </Link>
                            </DropdownMenuItem>
                            {request.status !== "COMPLETED" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteRequest(request.id, request.document.id)
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Request
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No signing requests found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {allRequests.length === 0
                  ? "You haven't sent any signing invitations yet."
                  : "No requests match your current filters."}
              </p>
              {allRequests.length === 0 && (
                <Button asChild>
                  <Link href="/dashboard/documents">Upload a Document</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
