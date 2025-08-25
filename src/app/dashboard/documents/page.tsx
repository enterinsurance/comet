"use client"

import { Eye, FileText, Filter, MoreHorizontal, Search, Share2, Trash2, Upload } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Skeleton } from "@/components/ui/skeleton"
import { useDocuments } from "@/hooks/use-documents"

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500/10 text-green-700 border-green-200"
    case "SENT":
      return "bg-blue-500/10 text-blue-700 border-blue-200"
    case "PARTIALLY_SIGNED":
      return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
    case "DRAFT":
      return "bg-gray-500/10 text-gray-700 border-gray-200"
    case "EXPIRED":
      return "bg-red-500/10 text-red-700 border-red-200"
    case "CANCELLED":
      return "bg-red-500/10 text-red-700 border-red-200"
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-200"
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export default function AllDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const { documents, pagination, isLoading, error, deleteDocument, getDocumentStats } =
    useDocuments({
      page: currentPage,
      limit: 10,
      search: searchQuery,
      status: statusFilter,
    })

  const stats = getDocumentStats()

  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (
      confirm(`Are you sure you want to delete "${documentTitle}"? This action cannot be undone.`)
    ) {
      try {
        await deleteDocument(documentId)
      } catch (error) {
        // Error already handled in the hook with toast
      }
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Documents</h1>
          <p className="text-muted-foreground">View and manage your uploaded documents</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/documents/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Link>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PARTIALLY_SIGNED">Partially Signed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total === 0 ? "No documents uploaded yet" : "Total documents"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Draft documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent + stats.partiallySigned}</div>
            <p className="text-xs text-muted-foreground">Awaiting signatures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Fully signed documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {pagination.totalCount > 0
              ? `Showing ${(currentPage - 1) * 10 + 1}-${Math.min(currentPage * 10, pagination.totalCount)} of ${pagination.totalCount} documents`
              : "No documents found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Error loading documents</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || statusFilter ? "No documents found" : "No documents yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filter criteria."
                  : "Upload your first PDF document to get started with electronic signatures."}
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/documents/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Document
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{doc.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status.replace("_", " ").toLowerCase()}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        {doc._count.signatures > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">
                              {doc._count.signatures} signature
                              {doc._count.signatures !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
