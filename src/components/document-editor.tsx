"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PDFViewer } from "@/components/pdf-viewer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignatureField } from "@/types"
import { Edit3, Save, X } from "lucide-react"

interface DocumentEditorProps {
  documentId: string
  fileUrl: string
  fileName: string
  onEditModeChange?: (editMode: boolean) => void
}

export function DocumentEditor({ 
  documentId, 
  fileUrl, 
  fileName, 
  onEditModeChange 
}: DocumentEditorProps) {
  const [editMode, setEditMode] = useState(false)
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load signature fields when component mounts or document changes
  useEffect(() => {
    loadSignatureFields()
  }, [documentId]) // loadSignatureFields is stable

  const loadSignatureFields = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/documents/${documentId}/signature-fields`)
      
      if (!response.ok) {
        throw new Error("Failed to load signature fields")
      }
      
      const data = await response.json()
      setSignatureFields(data.signatureFields || [])
      setHasChanges(false)
    } catch (error) {
      console.error("Error loading signature fields:", error)
      toast.error("Failed to load signature fields")
    } finally {
      setIsLoading(false)
    }
  }

  const saveSignatureFields = async () => {
    try {
      setIsLoading(true)
      
      // Convert fields to API format (without id for new fields)
      const fieldsToSave = signatureFields.map(field => ({
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        page: field.page,
        label: field.label,
        required: field.required !== false, // default to true
        signerEmail: field.signerEmail,
      }))

      const response = await fetch(`/api/documents/${documentId}/signature-fields`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signatureFields: fieldsToSave }),
      })

      if (!response.ok) {
        throw new Error("Failed to save signature fields")
      }

      const data = await response.json()
      setSignatureFields(data.signatureFields || [])
      setHasChanges(false)
      toast.success("Signature fields saved successfully")
    } catch (error) {
      console.error("Error saving signature fields:", error)
      toast.error("Failed to save signature fields")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditModeToggle = () => {
    const newEditMode = !editMode
    setEditMode(newEditMode)
    onEditModeChange?.(newEditMode)

    // Load fresh data when entering edit mode
    if (newEditMode) {
      loadSignatureFields()
    }
  }

  const handleSignatureFieldsChange = useCallback((fields: SignatureField[]) => {
    setSignatureFields(fields)
    setHasChanges(true)
  }, [])

  const handleCancelEdit = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        loadSignatureFields() // Reload original data
        setEditMode(false)
        onEditModeChange?.(false)
      }
    } else {
      setEditMode(false)
      onEditModeChange?.(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Editor Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Document Editor</CardTitle>
              <CardDescription>
                {editMode 
                  ? "Click and drag to add signature fields" 
                  : "Add signature fields to prepare document for signing"
                }
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {!editMode ? (
                <Button onClick={handleEditModeToggle} disabled={isLoading}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Fields
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {signatureFields.length} field{signatureFields.length !== 1 ? 's' : ''}
                  </span>
                  
                  {hasChanges && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Unsaved changes
                    </span>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  
                  <Button 
                    onClick={saveSignatureFields} 
                    disabled={isLoading || !hasChanges}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Fields
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        {editMode && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-dashed border-blue-400 bg-blue-100/20"></div>
                <span className="text-muted-foreground">Signature field</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-dashed border-green-500 bg-green-200/30"></div>
                <span className="text-muted-foreground">Selected field</span>
              </div>
              <div className="text-muted-foreground">
                Click existing fields to select and move them
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* PDF Viewer with Edit Mode */}
      <PDFViewer
        fileUrl={fileUrl}
        fileName={fileName}
        editMode={editMode}
        signatureFields={signatureFields}
        onSignatureFieldsChange={handleSignatureFieldsChange}
        className="flex-1"
      />
    </div>
  )
}