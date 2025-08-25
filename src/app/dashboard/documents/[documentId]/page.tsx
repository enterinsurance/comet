"use client"

import { ArrowLeft, Calendar, Download, FileText, MoreHorizontal, Share2, User } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DocumentPreparation } from "@/components/document-preparation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

interface Document {
  id: string
  title: string
  fileName: string
  fileSize: number
  status: string
  createdAt: string
  updatedAt: string
  filePath: string
  _count: {
    signatures: number
    signingRequests: number
  }
}

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

export default function DocumentViewPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.documentId as string

  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = (newStatus: string) => {
    if (document) {
      setDocument({ ...document, status: newStatus })
    }
  }

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/documents/${documentId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Document not found")
          }
          if (response.status === 401) {
            throw new Error("Access denied")
          }
          throw new Error("Failed to load document")
        }

        const data = await response.json()
        setDocument(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load document"
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  const handleDeleteDocument = async () => {
    if (!document) return

    if (
      confirm(`Are you sure you want to delete "${document.title}"? This action cannot be undone.`)
    ) {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete document")
        }

        toast.success("Document deleted successfully")
        router.push("/dashboard/documents")
      } catch (error) {
        toast.error("Failed to delete document")
      }
    }
  }

  const downloadDocument = () => {
    if (!document) return

    const link = window.document.createElement("a")
    link.href = document.filePath
    link.download = document.fileName
    link.target = "_blank"
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-96" />
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/documents">Documents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>View Document</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Alert variant="destructive">
          <AlertDescription>
            <div className="font-medium">Error loading document</div>
            <div className="text-sm mt-1">{error || "Document not found"}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.push("/dashboard/documents")}
            >
              Back to Documents
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/documents">Documents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{document.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
          <p className="text-muted-foreground">View and manage your document</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={downloadDocument}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Document
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const editorContainer = window.document.getElementById("document-editor")
                  editorContainer?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Add Signature Fields
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDeleteDocument}>
                <FileText className="h-4 w-4 mr-2" />
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Document Layout */}
      <div className="grid gap-6 lg:grid-cols-4 h-full">
        {/* Document Info Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Status</div>
                <Badge variant="outline" className={getStatusColor(document.status)}>
                  {document.status.replace("_", " ").toLowerCase()}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">File Size</div>
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(document.fileSize)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Created</div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(document.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Last Updated</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(document.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {document._count.signatures > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Signatures</div>
                  <div className="text-sm text-green-600">
                    {document._count.signatures} signature
                    {document._count.signatures !== 1 ? "s" : ""}
                  </div>
                </div>
              )}

              {document._count.signingRequests > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Signing Requests</div>
                  <div className="text-sm text-blue-600">
                    {document._count.signingRequests} request
                    {document._count.signingRequests !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
              <CardDescription>What you can do with this document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {document.status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const editorContainer = window.document.getElementById("document-editor")
                    editorContainer?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Prepare Document
                </Button>
              )}

              {document.status === "SENT" && (
                <div className="text-sm text-green-600 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-medium">Document Ready</div>
                  <div className="text-xs text-green-700 mt-1">
                    This document is prepared and ready for signing
                  </div>
                </div>
              )}

              {document.status === "SENT" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const editorContainer = window.document.getElementById("document-editor")
                    editorContainer?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Send for Signing
                </Button>
              )}

              {document.status === "DRAFT" && (
                <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                  <User className="h-4 w-4 mr-2" />
                  Send for Signing
                  <Badge variant="secondary" className="ml-auto">
                    Prepare First
                  </Badge>
                </Button>
              )}

              <Button variant="outline" size="sm" className="w-full justify-start">
                <Share2 className="h-4 w-4 mr-2" />
                Share Document
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PDF Viewer */}
        <div className="lg:col-span-3">
          <div id="document-editor">
            <DocumentPreparation
              documentId={documentId}
              documentTitle={document.title}
              fileUrl={document.filePath}
              fileName={document.fileName}
              currentStatus={document.status}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
