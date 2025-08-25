"use client"

import { AlertCircle, CheckCircle, FileText, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SignatureConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  signerName: string
  documentName: string
  signaturePreview?: string
  isSubmitting?: boolean
}

export function SignatureConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  signerName,
  documentName,
  signaturePreview,
  isSubmitting = false,
}: SignatureConfirmationDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  const handleConfirm = () => {
    if (acknowledged) {
      onConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Confirm Your Signature
          </DialogTitle>
          <DialogDescription>Please review your signature before submitting</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="text-sm">
              <strong>Document:</strong>
              <p className="text-muted-foreground">{documentName}</p>
            </div>
            <div className="text-sm">
              <strong>Signing as:</strong>
              <p className="text-muted-foreground">{signerName}</p>
            </div>
          </div>

          {/* Signature Preview */}
          {signaturePreview && (
            <div>
              <p className="text-sm font-medium mb-2">Your signature:</p>
              <div className="border rounded-lg p-4 bg-white flex items-center justify-center">
                <img
                  src={signaturePreview}
                  alt="Signature preview"
                  className="max-h-20 max-w-full"
                />
              </div>
            </div>
          )}

          {/* Legal Acknowledgment */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Legal Notice</p>
                <p className="text-blue-700">
                  By signing this document electronically, you agree that your electronic signature
                  has the same legal effect as a handwritten signature.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                I acknowledge that I have read and understood the legal notice above, and I consent
                to sign this document electronically.
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!acknowledged || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sign Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
