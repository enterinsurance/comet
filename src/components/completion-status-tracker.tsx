"use client"

import { CheckCircle, Clock, Download, FileCheck, Mail, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface CompletionStatusTrackerProps {
  document: {
    id: string
    title: string
    status: string
    finalizedAt?: string | null
    completedDocumentUrl?: string | null
  }
  totalSignatures: number
  completedSignatures: number
  signatures: Array<{
    signerName: string
    signedAt: string
  }>
  invitations: Array<{
    id: string
    recipientName: string
    recipientEmail: string
    status: string
    signedAt?: string | null
    viewedAt?: string | null
  }>
  onDownload?: () => void
}

export function CompletionStatusTracker({
  document,
  totalSignatures,
  completedSignatures,
  signatures,
  invitations,
  onDownload,
}: CompletionStatusTrackerProps) {
  const isFullyComplete = completedSignatures === totalSignatures && totalSignatures > 0
  const isDocumentFinalized = document.status === "COMPLETED" && !!document.completedDocumentUrl
  const progressPercentage = totalSignatures > 0 ? (completedSignatures / totalSignatures) * 100 : 0

  const getInvitationStatus = (invitation: (typeof invitations)[0]) => {
    if (invitation.status === "COMPLETED") {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: "Signed",
        color: "text-green-600",
        bgColor: "bg-green-50",
        badgeVariant: "default" as const,
      }
    }
    if (invitation.viewedAt) {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-600" />,
        text: "Viewed",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        badgeVariant: "secondary" as const,
      }
    }
    return {
      icon: <Clock className="h-4 w-4 text-gray-400" />,
      text: "Pending",
      color: "text-gray-500",
      bgColor: "bg-gray-50",
      badgeVariant: "outline" as const,
    }
  }

  const getOverallStatus = () => {
    if (isDocumentFinalized) {
      return {
        title: "Document Complete ✅",
        description: "All signatures collected and document finalized",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      }
    }
    if (isFullyComplete) {
      return {
        title: "Finalizing Document ⏳",
        description: "All signatures collected, generating final document...",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      }
    }
    return {
      title: "Collection in Progress 📝",
      description: `${completedSignatures} of ${totalSignatures} signatures collected`,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    }
  }

  const overallStatus = getOverallStatus()

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className={`${overallStatus.borderColor} ${overallStatus.bgColor}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${overallStatus.color}`}>{overallStatus.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{overallStatus.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Signing Progress</span>
              <span className="font-medium">
                {completedSignatures}/{totalSignatures} signatures
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>

          {/* Document Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Final Document:</span>
            </div>
            <Badge variant={isDocumentFinalized ? "default" : "secondary"}>
              {isDocumentFinalized ? "Ready" : "Processing"}
            </Badge>
          </div>

          {/* Download Button */}
          {isDocumentFinalized && onDownload && (
            <>
              <Separator />
              <Button onClick={onDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Signed Document
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detailed Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Signature Status
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {invitations.map((invitation) => {
            const status = getInvitationStatus(invitation)
            const signature = signatures.find(
              (sig) =>
                sig.signerName === invitation.recipientName ||
                sig.signerName.toLowerCase() === invitation.recipientName.toLowerCase()
            )

            return (
              <div
                key={invitation.id}
                className={`flex items-center justify-between p-3 rounded-lg ${status.bgColor} border`}
              >
                <div className="flex items-center gap-3">
                  {status.icon}
                  <div>
                    <p className="text-sm font-medium">{invitation.recipientName}</p>
                    <p className="text-xs text-muted-foreground">{invitation.recipientEmail}</p>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant={status.badgeVariant} className="mb-1">
                    {status.text}
                  </Badge>
                  {signature?.signedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(signature.signedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {!signature && invitation.viewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Viewed{" "}
                      {new Date(invitation.viewedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Timeline Card */}
      {(signatures.length > 0 || document.finalizedAt) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Completion Timeline
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Signature Events */}
            {signatures
              .sort((a, b) => new Date(a.signedAt).getTime() - new Date(b.signedAt).getTime())
              .map((signature, index) => (
                <div key={`${signature.signerName}-${signature.signedAt}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    {index < signatures.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">
                      {signature.signerName} signed the document
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(signature.signedAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

            {/* Finalization Event */}
            {document.finalizedAt && (
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                  <FileCheck className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Document finalized</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(document.finalizedAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
