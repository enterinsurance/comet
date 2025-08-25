"use client"

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Loader2,
  MousePointer,
  RotateCcw,
  Save,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SignatureField } from "@/types"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Set up PDF.js worker to use local file
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"


interface PDFViewerProps {
  fileUrl: string
  fileName?: string
  className?: string
  editMode?: boolean
  signatureFields?: SignatureField[]
  onSignatureFieldsChange?: (fields: SignatureField[]) => void
}

export function PDFViewer({ 
  fileUrl, 
  fileName, 
  className, 
  editMode = false,
  signatureFields = [],
  onSignatureFieldsChange 
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const [localSignatureFields, setLocalSignatureFields] = useState<SignatureField[]>(signatureFields)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  // Sync signature fields with props
  useEffect(() => {
    setLocalSignatureFields(signatureFields)
  }, [signatureFields])

  // Generate unique ID for signature fields
  const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Convert screen coordinates to PDF coordinates
  const screenToPdfCoordinates = useCallback((screenX: number, screenY: number) => {
    if (!pageRef.current) return { x: 0, y: 0 }
    
    const pageRect = pageRef.current.getBoundingClientRect()
    const relativeX = screenX - pageRect.left
    const relativeY = screenY - pageRect.top
    
    // Convert to PDF coordinates (0-1 range)
    const x = relativeX / pageRect.width
    const y = relativeY / pageRect.height
    
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }
  }, [scale])

  // Convert PDF coordinates to screen coordinates
  const pdfToScreenCoordinates = useCallback((pdfX: number, pdfY: number) => {
    if (!pageRef.current) return { x: 0, y: 0 }
    
    const pageRect = pageRef.current.getBoundingClientRect()
    const x = pdfX * pageRect.width
    const y = pdfY * pageRect.height
    
    return { x, y }
  }, [scale])

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

  // Handle mouse events for signature field placement
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || e.button !== 0) return
    
    const { x, y } = screenToPdfCoordinates(e.clientX, e.clientY)
    
    // Check if clicking on existing field
    const clickedField = localSignatureFields.find(field => 
      field.page === pageNumber &&
      x >= field.x && x <= field.x + field.width &&
      y >= field.y && y <= field.y + field.height
    )
    
    if (clickedField) {
      setSelectedField(clickedField.id)
      setDragStart({ x: e.clientX, y: e.clientY })
      setIsDragging(true)
    } else {
      // Start creating new field
      setSelectedField(null)
      setDragStart({ x: e.clientX, y: e.clientY })
      setIsDragging(true)
    }
    
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !isDragging || !dragStart) return
    
    const currentX = e.clientX
    const currentY = e.clientY
    
    if (selectedField) {
      // Move existing field
      const deltaX = (currentX - dragStart.x) / (pageRef.current?.getBoundingClientRect().width || 1)
      const deltaY = (currentY - dragStart.y) / (pageRef.current?.getBoundingClientRect().height || 1)
      
      setLocalSignatureFields(prev => prev.map(field => 
        field.id === selectedField
          ? {
              ...field,
              x: Math.max(0, Math.min(1 - field.width, field.x + deltaX)),
              y: Math.max(0, Math.min(1 - field.height, field.y + deltaY))
            }
          : field
      ))
      
      setDragStart({ x: currentX, y: currentY })
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !isDragging || !dragStart) return
    
    if (!selectedField) {
      // Create new signature field
      const start = screenToPdfCoordinates(dragStart.x, dragStart.y)
      const end = screenToPdfCoordinates(e.clientX, e.clientY)
      
      const x = Math.min(start.x, end.x)
      const y = Math.min(start.y, end.y)
      const width = Math.abs(end.x - start.x)
      const height = Math.abs(end.y - start.y)
      
      // Only create field if it has minimum size
      if (width > 0.02 && height > 0.01) {
        const newField: SignatureField = {
          id: generateId(),
          documentId: '', // Will be set when saved
          x,
          y,
          width,
          height,
          page: pageNumber,
          required: true
        }
        
        const updatedFields = [...localSignatureFields, newField]
        setLocalSignatureFields(updatedFields)
        onSignatureFieldsChange?.(updatedFields)
        setSelectedField(newField.id)
      }
    } else {
      // Finished moving field
      onSignatureFieldsChange?.(localSignatureFields)
    }
    
    setIsDragging(false)
    setDragStart(null)
  }

  // Delete selected signature field
  const deleteSignatureField = (fieldId: string) => {
    const updatedFields = localSignatureFields.filter(field => field.id !== fieldId)
    setLocalSignatureFields(updatedFields)
    onSignatureFieldsChange?.(updatedFields)
    setSelectedField(null)
  }

  useEffect(() => {
    // Reset page when fileUrl changes
    setPageNumber(1)
    setScale(1.0)
    setRotation(0)
    setIsLoading(true)
    setError(null)
    setSelectedField(null)
    setIsDragging(false)
    setDragStart(null)
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
            
            {/* Edit Mode Controls */}
            {editMode && (
              <div className="flex items-center space-x-2 border-l pl-2 ml-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Mode</span>
                </div>
                
                {selectedField && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSignatureField(selectedField)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete Field"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                <div className="text-sm text-muted-foreground">
                  Fields: {localSignatureFields.filter(f => f.page === pageNumber).length}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions for Edit Mode */}
      {editMode && (
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <MousePointer className="h-4 w-4 inline mr-1" />
            <strong>Edit Mode:</strong> Click and drag to create signature fields. Click existing fields to select and move them.
          </div>
        </div>
      )}
      
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
            <div className="relative shadow-lg">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                error=""
              >
                <div 
                  ref={pageRef}
                  className="relative"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{ cursor: editMode ? (isDragging ? 'grabbing' : 'crosshair') : 'default' }}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="border"
                  />
                  
                  {/* Signature Field Overlay */}
                  {editMode && localSignatureFields
                    .filter(field => field.page === pageNumber)
                    .map(field => {
                      const pageRect = pageRef.current?.getBoundingClientRect()
                      if (!pageRect) return null
                      
                      const left = field.x * pageRect.width
                      const top = field.y * pageRect.height
                      const width = field.width * pageRect.width
                      const height = field.height * pageRect.height
                      
                      return (
                        <div
                          key={field.id}
                          className={`absolute border-2 border-dashed bg-blue-100/20 ${
                            selectedField === field.id 
                              ? 'border-blue-500 bg-blue-200/30' 
                              : 'border-blue-400 hover:border-blue-500'
                          }`}
                          style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            pointerEvents: 'auto'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedField(field.id)
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium opacity-80">
                              Signature
                            </div>
                          </div>
                          
                          {selectedField === field.id && (
                            <button
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSignatureField(field.id)
                              }}
                              title="Delete field"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )
                    })
                  }
                </div>
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
