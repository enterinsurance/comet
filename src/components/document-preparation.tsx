"use client"

import { AlertTriangle, CheckCircle, Eye, FileText, Mail, Send, Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { DocumentEditor } from "@/components/document-editor"
import { InvitationManagement } from "@/components/invitation-management"
import { PDFViewer } from "@/components/pdf-viewer"
import { PreparationConfirmation } from "@/components/preparation-confirmation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SignatureField } from "@/types"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface DocumentPreparationProps {
  documentId: string
  documentTitle: string
  fileUrl: string
  fileName: string
  currentStatus: string
  onStatusChange?: (status: string) => void
}

export function DocumentPreparation({
  documentId,
  documentTitle,
  fileUrl,
  fileName,
  currentStatus,
  onStatusChange,
}: DocumentPreparationProps) {
  const [activeTab, setActiveTab] = useState("edit")
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Load signature fields
  useEffect(() => {
    loadSignatureFields()
  }, [documentId])

  // Validate signature fields whenever they change
  useEffect(() => {
    validateSignatureFields()
  }, [signatureFields])

  const loadSignatureFields = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/documents/${documentId}/signature-fields`)

      if (!response.ok) {
        throw new Error("Failed to load signature fields")
      }

      const data = await response.json()
      setSignatureFields(data.signatureFields || [])
    } catch (error) {
      console.error("Error loading signature fields:", error)
      toast.error("Failed to load signature fields")
    } finally {
      setIsLoading(false)
    }
  }

  const validateSignatureFields = useCallback(() => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if document has any signature fields
    if (signatureFields.length === 0) {
      errors.push("Document must have at least one signature field")
    }

    // Check for overlapping fields on same page
    const pageGroups = signatureFields.reduce(
      (acc, field) => {
        if (!acc[field.page]) {
          acc[field.page] = []
        }
        acc[field.page].push(field)
        return acc
      },
      {} as Record<number, SignatureField[]>
    )

    Object.entries(pageGroups).forEach(([page, fields]) => {
      for (let i = 0; i < fields.length; i++) {
        for (let j = i + 1; j < fields.length; j++) {
          const field1 = fields[i]
          const field2 = fields[j]

          // Check for overlap
          const overlap = !(
            field1.x + field1.width <= field2.x ||
            field2.x + field2.width <= field1.x ||
            field1.y + field1.height <= field2.y ||
            field2.y + field2.height <= field1.y
          )

          if (overlap) {
            warnings.push(`Overlapping signature fields detected on page ${page}`)
          }
        }
      }
    })

    // Check for fields that are too small
    signatureFields.forEach((field, index) => {
      if (field.width < 0.03 || field.height < 0.015) {
        warnings.push(`Signature field ${index + 1} on page ${field.page} may be too small`)
      }
    })

    // Check for fields near page edges
    signatureFields.forEach((field, index) => {
      const margin = 0.02 // 2% margin
      if (
        field.x < margin ||
        field.y < margin ||
        field.x + field.width > 1 - margin ||
        field.y + field.height > 1 - margin
      ) {
        warnings.push(
          `Signature field ${index + 1} on page ${field.page} is very close to page edge`
        )
      }
    })

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
    })
  }, [signatureFields])

  const handlePrepareClick = () => {
    if (!validation.isValid) {
      toast.error("Please fix validation errors before preparing document")
      return
    }
    setShowConfirmation(true)
  }

  const prepareDocumentForSigning = async () => {
    try {
      setIsLoading(true)
      setShowConfirmation(false)

      // Update document status to SENT (ready for signing)
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "SENT",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to prepare document")
      }

      toast.success("Document prepared and ready for signing!")
      onStatusChange?.("SENT")

      // Switch to preview tab to show final result
      setActiveTab("preview")
    } catch (error) {
      console.error("Error preparing document:", error)
      toast.error("Failed to prepare document")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignatureFieldsChange = (fields: SignatureField[]) => {
    setSignatureFields(fields)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Document Preparation</span>
            <Badge variant={currentStatus === "DRAFT" ? "secondary" : "default"}>
              {currentStatus}
            </Badge>
          </CardTitle>
          <CardDescription>
            Prepare "{documentTitle}" for signing by adding signature fields and validating the
            layout
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Validation Summary */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span>Validation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Errors (must be fixed):</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validation.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Warnings (recommended to fix):</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="edit" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Edit Fields</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
          <TabsTrigger
            value="send"
            className="flex items-center space-x-2"
            disabled={currentStatus !== "SENT"}
          >
            <Mail className="h-4 w-4" />
            <span>Send for Signing{currentStatus !== "SENT" ? ` (${currentStatus})` : ""}</span>
          </TabsTrigger>
        </TabsList>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signature Field Editor</CardTitle>
              <CardDescription>
                Add and position signature fields where recipients should sign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentEditor
                documentId={documentId}
                fileUrl={fileUrl}
                fileName={fileName}
                onEditModeChange={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Document Preview</CardTitle>
                  <CardDescription>
                    Preview how the document will look with signature fields
                  </CardDescription>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {signatureFields.length} field{signatureFields.length !== 1 ? "s" : ""}
                  </Badge>

                  {validation.isValid && currentStatus === "DRAFT" && (
                    <Button onClick={handlePrepareClick} disabled={isLoading}>
                      <Send className="h-4 w-4 mr-2" />
                      Prepare for Signing
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PDFViewer
                fileUrl={fileUrl}
                fileName={fileName}
                editMode={false}
                signatureFields={signatureFields}
                className="h-[600px]"
              />

              {signatureFields.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Signature Field Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {signatureFields.map((field, index) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-800">
                          Field {index + 1} - Page {field.page}
                          {field.signerEmail && ` (${field.signerEmail})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send for Signing Tab */}
        <TabsContent value="send" className="space-y-4">
          <InvitationManagement
            documentId={documentId}
            documentTitle={documentTitle}
            documentStatus={currentStatus}
            signatureFields={signatureFields}
            onStatusChange={onStatusChange}
          />
        </TabsContent>
      </Tabs>

      {/* Status Summary */}
      {validation.isValid && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Document is ready for signing!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All signature fields have been validated and the document is properly prepared.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <PreparationConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={prepareDocumentForSigning}
        documentTitle={documentTitle}
        signatureFields={signatureFields}
        isLoading={isLoading}
      />
    </div>
  )
}
