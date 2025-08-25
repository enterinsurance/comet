"use client"

import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SigningProgressProps {
  totalSigners: number
  completedSigners: number
  pendingSigners: number
  progressPercentage: number
  signers: Array<{
    id: string
    name: string
    email: string
    status: string
    signedAt?: string
    isSigned: boolean
  }>
}

export function SigningProgress({
  totalSigners,
  completedSigners,
  pendingSigners,
  progressPercentage,
  signers,
}: SigningProgressProps) {
  const getStatusIcon = (status: string, isSigned: boolean) => {
    if (isSigned) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    if (status === "VIEWED") {
      return <Clock className="h-4 w-4 text-yellow-600" />
    }
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getStatusText = (status: string, isSigned: boolean) => {
    if (isSigned) return "Signed"
    if (status === "VIEWED") return "Viewed"
    return "Pending"
  }

  const getStatusColor = (status: string, isSigned: boolean) => {
    if (isSigned) return "text-green-600"
    if (status === "VIEWED") return "text-yellow-600"
    return "text-gray-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5" />
          Signing Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {completedSigners}/{totalSigners} signed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercentage}% complete</span>
            <span>{pendingSigners} pending</span>
          </div>
        </div>

        {/* Signers List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Required Signatures:</h4>
          <div className="space-y-2">
            {signers.map((signer) => (
              <div
                key={signer.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(signer.status, signer.isSigned)}
                  <div>
                    <p className="text-sm font-medium">{signer.name}</p>
                    <p className="text-xs text-muted-foreground">{signer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-medium ${getStatusColor(signer.status, signer.isSigned)}`}
                  >
                    {getStatusText(signer.status, signer.isSigned)}
                  </p>
                  {signer.signedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(signer.signedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Status */}
        {progressPercentage === 100 ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">All signatures collected!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Waiting for {pendingSigners} more signature{pendingSigners !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
