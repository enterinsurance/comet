"use client"

import { Mail, Send, Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { InvitationTracker } from "@/components/invitation-tracker"
import { SignerManagement } from "@/components/signer-management"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SignatureField } from "@/types"

interface Signer {
  id: string
  email: string
  name?: string
  message?: string
  assignedFields: SignatureField[]
}

interface InvitationManagementProps {
  documentId: string
  documentTitle: string
  documentStatus: string
  signatureFields: SignatureField[]
  onStatusChange?: (status: string) => void
}

export function InvitationManagement({
  documentId,
  documentTitle,
  documentStatus,
  signatureFields,
  onStatusChange,
}: InvitationManagementProps) {
  const [activeTab, setActiveTab] = useState("manage")
  const [signers, setSigners] = useState<Signer[]>([])
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expirationDays, setExpirationDays] = useState(7)
  const [refreshTracker, setRefreshTracker] = useState(0)

  const handleSignersChange = useCallback((newSigners: Signer[]) => {
    setSigners(newSigners)
  }, [])

  const canSendInvitations = () => {
    return documentStatus === "SENT" && signers.length > 0 && signatureFields.length > 0
  }

  const getInvitationSummary = () => {
    const totalFields = signatureFields.length
    const assignedFields = signers.reduce(
      (total, signer) => total + signer.assignedFields.length,
      0
    )
    const unassignedFields = totalFields - assignedFields

    return {
      signers: signers.length,
      totalFields,
      assignedFields,
      unassignedFields,
      hasUnassignedFields: unassignedFields > 0,
    }
  }

  const handleSendInvitations = async () => {
    if (!canSendInvitations()) {
      toast.error("Cannot send invitations at this time")
      return
    }

    try {
      setIsLoading(true)

      // Prepare signers data for API
      const signersData = signers.map((signer) => ({
        email: signer.email,
        name: signer.name,
        message: signer.message,
        assignedFieldIds: signer.assignedFields.map((field) => field.id),
      }))

      const response = await fetch(`/api/documents/${documentId}/send-invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signers: signersData,
          expiresInDays: expirationDays,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send invitations")
      }

      const result = await response.json()

      toast.success(
        `Successfully sent ${result.successfulEmails} invitation${result.successfulEmails !== 1 ? "s" : ""}!`
      )

      if (result.failedEmails > 0) {
        toast.error(
          `Failed to send ${result.failedEmails} invitation${result.failedEmails !== 1 ? "s" : ""}`
        )
      }

      setShowSendDialog(false)
      setActiveTab("status")
      setRefreshTracker((prev) => prev + 1)
    } catch (error) {
      console.error("Error sending invitations:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send invitations")
    } finally {
      setIsLoading(false)
    }
  }

  const summary = getInvitationSummary()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Send for Signing</span>
          </CardTitle>
          <CardDescription>
            Manage signers and send email invitations for "{documentTitle}"
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Document Status Check */}
      {documentStatus !== "SENT" && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-orange-800">
              <div className="font-medium">Document Not Ready</div>
            </div>
            <div className="text-sm text-orange-700 mt-1">
              This document must be prepared for signing before you can send invitations. Please go
              back to the preparation step and prepare the document first.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Manage Signers</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Invitation Status</span>
          </TabsTrigger>
        </TabsList>

        {/* Manage Signers Tab */}
        <TabsContent value="manage" className="space-y-6">
          <SignerManagement
            documentId={documentId}
            documentTitle={documentTitle}
            signatureFields={signatureFields}
            onSignersChange={handleSignersChange}
          />

          {/* Send Invitations Section */}
          {summary.signers > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ready to Send Invitations</CardTitle>
                <CardDescription>
                  Review your signer setup and send signing invitations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{summary.signers}</div>
                    <div className="text-sm text-blue-700">Signers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{summary.totalFields}</div>
                    <div className="text-sm text-blue-700">Total Fields</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {summary.assignedFields}
                    </div>
                    <div className="text-sm text-green-700">Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {summary.unassignedFields}
                    </div>
                    <div className="text-sm text-gray-700">Unassigned</div>
                  </div>
                </div>

                {/* Warnings */}
                {summary.hasUnassignedFields && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    <strong>Note:</strong> You have {summary.unassignedFields} unassigned signature
                    field{summary.unassignedFields !== 1 ? "s" : ""}. These fields can be signed by
                    any recipient who receives the signing URL.
                  </div>
                )}

                {/* Send Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowSendDialog(true)}
                    disabled={!canSendInvitations() || isLoading}
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitations ({summary.signers})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invitation Status Tab */}
        <TabsContent value="status">
          <InvitationTracker
            documentId={documentId}
            documentTitle={documentTitle}
            key={refreshTracker}
            onRefresh={() => setRefreshTracker((prev) => prev + 1)}
          />
        </TabsContent>
      </Tabs>

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Signing Invitations</DialogTitle>
            <DialogDescription>
              You're about to send {summary.signers} signing invitation
              {summary.signers !== 1 ? "s" : ""} for "{documentTitle}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium">{summary.signers}</div>
                <div className="text-sm text-muted-foreground">Recipients</div>
              </div>
              <div>
                <div className="font-medium">{summary.assignedFields}</div>
                <div className="text-sm text-muted-foreground">Assigned Fields</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration-days">Invitation Expires In</Label>
              <Input
                id="expiration-days"
                type="number"
                min={1}
                max={30}
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
              />
              <div className="text-xs text-muted-foreground">
                Recipients will have {expirationDays} day{expirationDays !== 1 ? "s" : ""} to sign
                the document
              </div>
            </div>

            {summary.hasUnassignedFields && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>Warning:</strong> {summary.unassignedFields} signature field
                {summary.unassignedFields !== 1 ? "s are" : " is"} unassigned. Any recipient will be
                able to sign these fields.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSendInvitations} disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading
                ? "Sending..."
                : `Send ${summary.signers} Invitation${summary.signers !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
