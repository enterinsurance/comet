"use client"

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Set up PDF.js worker to use local file
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface PDFViewerProps {
  fileUrl: string
  fileName?: string
  className?: string
}

export function PDFViewer({ fileUrl, fileName, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error)
    setError("Failed to load PDF document")
    setIsLoading(false)
    toast.error("Failed to load PDF document")
  }

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1)
    }
  }

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(pageNumber + 1)
    }
  }

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.25, 3.0))
  }

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.25, 0.5))
  }

  const rotateDocument = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360)
  }

  const resetView = () => {
    setScale(1.0)
    setRotation(0)
    setPageNumber(1)
  }

  const downloadPDF = () => {
    const link = window.document.createElement("a")
    link.href = fileUrl
    link.download = fileName || "document.pdf"
    link.target = "_blank"
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  useEffect(() => {
    // Reset page when fileUrl changes
    setPageNumber(1)
    setScale(1.0)
    setRotation(0)
    setIsLoading(true)
    setError(null)
  }, [fileUrl])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Page Navigation */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  Page {pageNumber} of {numPages || "?"}
                </span>
                {numPages && numPages > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round((pageNumber / numPages) * 100)}%
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={!numPages || pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-sm min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>

              <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={rotateDocument} title="Rotate 90°">
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={resetView} title="Reset View">
                Reset
              </Button>

              <Button variant="outline" size="sm" onClick={downloadPDF} title="Download PDF">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center p-4">
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading PDF...</span>
            </div>
          )}

          {error && (
            <div className="text-center">
              <div className="text-red-600 mb-2">{error}</div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {!error && (
            <div className="shadow-lg">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                error=""
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="border"
                />
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
