"use client"

import { Calendar, CheckCircle, Download, FileText, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CompletedDocumentCardProps {
  document: {
    id: string
    title: string
    status: string
    completedDocumentUrl?: string
    finalizedAt?: string
    createdAt: string
    _count?: {
      invitations: number
    }
  }
  signatures?: Array<{
    signerName: string
    signedAt: string
  }>
}

export function CompletedDocumentCard({ document, signatures = [] }: CompletedDocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!document.completedDocumentUrl) {
      toast.error("Completed document not available")
      return
    }

    setIsDownloading(true)
    try {
      // Use the secure download API endpoint
      const response = await fetch(`/api/documents/${document.id}/download`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Download failed" }))
        throw new Error(errorData.error || "Download failed")
      }

      // Get the filename from Content-Disposition header or use fallback
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `${document.title}_signed.pdf`

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]*)"/)
        if (match) {
          filename = match[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = globalThis.document.createElement("a")
      a.href = url
      a.download = filename
      globalThis.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      globalThis.document.body.removeChild(a)

      toast.success("Document downloaded successfully")
    } catch (error) {
      console.error("Download error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to download document")
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreview = () => {
    if (document.completedDocumentUrl) {
      window.open(document.completedDocumentUrl, "_blank")
    }
  }

  const isCompleted = document.status === "COMPLETED"
  const hasCompletedDocument = !!document.completedDocumentUrl

  return (
    <Card
      className={`transition-all duration-200 ${isCompleted ? "border-green-200 bg-green-50/30" : "hover:shadow-md"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{document.title}</CardTitle>
              <CardDescription className="mt-1">
                Created {new Date(document.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={isCompleted ? "default" : "secondary"}
              className="bg-green-100 text-green-800"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Document Statistics */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{signatures.length} signatures</span>
            </div>
            {document.finalizedAt && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Finalized {new Date(document.finalizedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signatures Summary */}
        {signatures.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Signatures:</h4>
            <div className="space-y-1">
              {signatures.map((signature) => (
                <div
                  key={`${signature.signerName}-${signature.signedAt}`}
                  className="flex items-center justify-between text-xs bg-white rounded p-2 border"
                >
                  <span className="font-medium">{signature.signerName}</span>
                  <span className="text-muted-foreground">
                    {new Date(signature.signedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={!hasCompletedDocument}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={!hasCompletedDocument || isDownloading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>

        {!hasCompletedDocument && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ Final document is being processed. Please check back in a moment.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
