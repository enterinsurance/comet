"use client"

import { AlertTriangle, CheckCircle, FileText, Send, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { SignatureField } from "@/types"

interface PreparationConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  documentTitle: string
  signatureFields: SignatureField[]
  isLoading?: boolean
}

export function PreparationConfirmation({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
  signatureFields,
  isLoading = false,
}: PreparationConfirmationProps) {
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

  const totalPages = Object.keys(pageGroups).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Prepare Document for Signing</span>
          </DialogTitle>
          <DialogDescription>
            Review the signature field configuration before preparing "{documentTitle}" for signing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{signatureFields.length}</div>
              <div className="text-sm text-blue-700">Signature Fields</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{totalPages}</div>
              <div className="text-sm text-blue-700">Pages with Fields</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {signatureFields.filter((f) => f.signerEmail).length}
              </div>
              <div className="text-sm text-blue-700">Assigned Fields</div>
            </div>
          </div>

          <Separator />

          {/* Field Details */}
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Signature Field Details</span>
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.entries(pageGroups)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([page, fields]) => (
                  <div key={page} className="border rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">Page {page}</div>
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 border-2 border-dashed border-blue-400 bg-blue-100/50"></div>
                            <span>Field {index + 1}</span>
                          </div>
                          <div className="text-gray-600">
                            {field.signerEmail || "Unassigned"}
                            {field.required && <span className="ml-1 text-red-500">*</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <Separator />

          {/* What happens next */}
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>What happens when you prepare this document?</span>
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Document status will change from "Draft" to "Ready for Signing"</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Signature fields will be locked and cannot be modified</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Document will be ready to send signing invitations (Phase 4)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Recipients will be able to sign at the designated areas</span>
              </div>
            </div>
          </div>

          {/* Warning for unassigned fields */}
          {signatureFields.some((f) => !f.signerEmail) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Some fields are unassigned</div>
                <div className="text-sm mt-1">
                  Fields without a specific signer email can be signed by anyone with access to the
                  document. You can assign specific signers later when sending invitations.
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex items-center space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>Preparing...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Prepare for Signing
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
