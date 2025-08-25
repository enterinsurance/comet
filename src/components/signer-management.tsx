"use client"

import { Mail, Plus, Trash2, User, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { isValidEmail } from "@/lib/email"
import { SignatureField } from "@/types"

interface Signer {
  id: string
  email: string
  name?: string
  message?: string
  assignedFields: SignatureField[]
}

interface SignerManagementProps {
  documentId: string
  documentTitle: string
  signatureFields: SignatureField[]
  onSignersChange?: (signers: Signer[]) => void
}

export function SignerManagement({
  documentId,
  documentTitle,
  signatureFields,
  onSignersChange
}: SignerManagementProps) {
  const [signers, setSigners] = useState<Signer[]>([])
  const [newSignerEmail, setNewSignerEmail] = useState("")
  const [newSignerName, setNewSignerName] = useState("")
  const [globalMessage, setGlobalMessage] = useState("")

  const generateSignerId = () => `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addSigner = () => {
    if (!newSignerEmail.trim()) {
      toast.error("Email address is required")
      return
    }

    if (!isValidEmail(newSignerEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check if email already exists
    if (signers.some(signer => signer.email.toLowerCase() === newSignerEmail.toLowerCase())) {
      toast.error("This email address has already been added")
      return
    }

    const newSigner: Signer = {
      id: generateSignerId(),
      email: newSignerEmail.trim(),
      name: newSignerName.trim() || undefined,
      message: globalMessage.trim() || undefined,
      assignedFields: []
    }

    const updatedSigners = [...signers, newSigner]
    setSigners(updatedSigners)
    onSignersChange?.(updatedSigners)

    // Reset form
    setNewSignerEmail("")
    setNewSignerName("")

    toast.success(`Added ${newSignerEmail} as a signer`)
  }

  const removeSigner = (signerId: string) => {
    const signer = signers.find(s => s.id === signerId)
    if (!signer) return

    const updatedSigners = signers.filter(s => s.id !== signerId)
    setSigners(updatedSigners)
    onSignersChange?.(updatedSigners)

    toast.success(`Removed ${signer.email} from signers`)
  }

  const updateSignerMessage = (signerId: string, message: string) => {
    const updatedSigners = signers.map(signer =>
      signer.id === signerId
        ? { ...signer, message: message.trim() || undefined }
        : signer
    )
    setSigners(updatedSigners)
    onSignersChange?.(updatedSigners)
  }

  const assignFieldToSigner = (fieldId: string, signerId: string | null) => {
    // First, remove the field from any existing assignments
    let updatedSigners = signers.map(signer => ({
      ...signer,
      assignedFields: signer.assignedFields.filter(field => field.id !== fieldId)
    }))

    // Then assign it to the new signer (if any)
    if (signerId) {
      const field = signatureFields.find(f => f.id === fieldId)
      if (field) {
        updatedSigners = updatedSigners.map(signer =>
          signer.id === signerId
            ? { ...signer, assignedFields: [...signer.assignedFields, field] }
            : signer
        )
      }
    }

    setSigners(updatedSigners)
    onSignersChange?.(updatedSigners)
  }

  const getUnassignedFields = () => {
    const assignedFieldIds = signers.flatMap(signer => signer.assignedFields.map(field => field.id))
    return signatureFields.filter(field => !assignedFieldIds.includes(field.id))
  }

  const getTotalAssignedFields = () => {
    return signers.reduce((total, signer) => total + signer.assignedFields.length, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manage Signers</span>
          </CardTitle>
          <CardDescription>
            Add recipients who need to sign "{documentTitle}" and assign signature fields to them
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{signers.length}</div>
              <div className="text-sm text-muted-foreground">Signers</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-dashed border-blue-400 bg-blue-100/20"></div>
              <div className="text-2xl font-bold text-green-600">{getTotalAssignedFields()}</div>
              <div className="text-sm text-muted-foreground">Assigned</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-dashed border-gray-400 bg-gray-100/20"></div>
              <div className="text-2xl font-bold text-gray-600">{getUnassignedFields().length}</div>
              <div className="text-sm text-muted-foreground">Unassigned</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Signer Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Signer</CardTitle>
          <CardDescription>
            Enter the email address and name of someone who needs to sign this document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signer-email">Email Address *</Label>
              <Input
                id="signer-email"
                type="email"
                placeholder="john@example.com"
                value={newSignerEmail}
                onChange={(e) => setNewSignerEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSigner()}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signer-name">Full Name (optional)</Label>
              <Input
                id="signer-name"
                type="text"
                placeholder="John Doe"
                value={newSignerName}
                onChange={(e) => setNewSignerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSigner()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-message">Default Message (optional)</Label>
            <Textarea
              id="global-message"
              placeholder="Please review and sign this document at your earliest convenience..."
              value={globalMessage}
              onChange={(e) => setGlobalMessage(e.target.value)}
              rows={2}
            />
            <div className="text-xs text-muted-foreground">
              This message will be included in all invitations (you can customize per signer later)
            </div>
          </div>

          <Button onClick={addSigner} disabled={!newSignerEmail.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Signer
          </Button>
        </CardContent>
      </Card>

      {/* Signers List */}
      {signers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Signers ({signers.length})</CardTitle>
            <CardDescription>
              Manage your signers and assign signature fields to them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signers.map((signer, index) => (
              <div key={signer.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{signer.name || signer.email}</div>
                      {signer.name && (
                        <div className="text-sm text-muted-foreground">{signer.email}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {signer.assignedFields.length} field{signer.assignedFields.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSigner(signer.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Assigned Fields */}
                {signer.assignedFields.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Assigned Fields:</div>
                    <div className="flex flex-wrap gap-2">
                      {signer.assignedFields.map((field) => (
                        <Badge key={field.id} variant="secondary" className="text-xs">
                          Page {field.page} - Field
                          <button
                            onClick={() => assignFieldToSigner(field.id, null)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label htmlFor={`message-${signer.id}`} className="text-sm">Custom Message</Label>
                  <Textarea
                    id={`message-${signer.id}`}
                    placeholder={globalMessage || "Add a personal message for this signer..."}
                    value={signer.message || ""}
                    onChange={(e) => updateSignerMessage(signer.id, e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unassigned Fields */}
      {getUnassignedFields().length > 0 && signers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-dashed border-gray-400 bg-gray-100/20"></div>
              <span>Unassigned Fields ({getUnassignedFields().length})</span>
            </CardTitle>
            <CardDescription>
              These signature fields haven't been assigned to any signer yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {getUnassignedFields().map((field) => (
                <div key={field.id} className="border rounded-lg p-3 space-y-2">
                  <div className="text-sm font-medium">Page {field.page} Field</div>
                  <select
                    className="w-full text-sm p-1 border rounded"
                    onChange={(e) => assignFieldToSigner(field.id, e.target.value || null)}
                    defaultValue=""
                  >
                    <option value="">Assign to signer...</option>
                    {signers.map((signer) => (
                      <option key={signer.id} value={signer.id}>
                        {signer.name || signer.email}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {signatureFields.length > 0 && signers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="font-medium text-muted-foreground">No signers added yet</div>
            <div className="text-sm text-muted-foreground mt-1">
              Add signers above to assign the {signatureFields.length} signature field{signatureFields.length !== 1 ? 's' : ''} in this document
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}