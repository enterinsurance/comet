"use client"

import { AlertCircle, ArrowLeft, CheckCircle, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Progress } from "@/components/ui/progress"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useToastHelpers } from "@/components/ui/toast-provider"
import { LoadingState, LoadingOverlay } from "@/components/ui/loading-state"

interface UploadedDocument {
  id: string
  title: string
  fileName: string
  fileSize: number
  status: string
  createdAt: string
  url: string
}

export default function UploadDocumentPage() {
  const router = useRouter()
  const toast = useToastHelpers()
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { uploadFiles, isUploading, uploadProgress } = useFileUpload({
    onSuccess: (document) => {
      setUploadedDocument(document)
      setUploadError(null)
      toast.success("Document uploaded successfully!", "Your document is ready for signature fields.")
      
      // Redirect to the document details page after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/documents/${document.id}`)
      }, 2000)
    },
    onError: (error) => {
      setUploadError(error)
      setUploadedDocument(null)
      toast.error("Upload failed", error)
    },
  })

  const handleFileSelect = async (files: File[]) => {
    await uploadFiles(files)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="space-y-6">
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
            <BreadcrumbPage>Upload Document</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-muted-foreground">
            Upload a PDF document to get started with electronic signatures
          </p>
        </div>
      </div>

      {/* Upload Status */}
      {isUploading && (
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Uploading document...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {uploadedDocument && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <div className="font-medium">Document uploaded successfully!</div>
              <div className="text-sm">
                <strong>{uploadedDocument.title}</strong> (
                {formatFileSize(uploadedDocument.fileSize)}) has been uploaded. You'll be redirected
                to the documents page shortly.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Upload failed</div>
            <div className="text-sm mt-1">{uploadError}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Select Document</CardTitle>
            <CardDescription>
              Choose a PDF file to upload. Maximum file size is 10MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileSelect={handleFileSelect}
              maxSize={10}
              maxFiles={1}
              accept=".pdf"
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
            <CardDescription>
              Please review these guidelines before uploading your document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">File Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Only PDF files are accepted</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Text-based PDFs work best for signature placement</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">What happens next?</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Your document will be securely stored</li>
                  <li>2. You can add signature fields (Phase 3)</li>
                  <li>3. Send signing invitations to recipients (Phase 4)</li>
                  <li>4. Track signing progress and collect signatures</li>
                </ol>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Security & Privacy</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Documents are encrypted during upload</li>
                  <li>• Secure cloud storage with access controls</li>
                  <li>• Only you can access your documents</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {!uploadedDocument && !isUploading && (
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Common questions about document upload and management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-2">Supported File Types</h4>
                <p className="text-sm text-muted-foreground">
                  Currently, only PDF files are supported. Make sure your document is saved as a PDF
                  before uploading.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">File Size Limits</h4>
                <p className="text-sm text-muted-foreground">
                  The maximum file size is 10MB. If your PDF is larger, consider compressing it or
                  splitting it into smaller documents.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Document Quality</h4>
                <p className="text-sm text-muted-foreground">
                  For best results, use high-quality PDFs with clear text. Scanned documents work
                  too, but text-based PDFs are recommended.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">After Upload</h4>
                <p className="text-sm text-muted-foreground">
                  Once uploaded, your document will appear in the All Documents page where you can
                  manage it and prepare it for signing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
