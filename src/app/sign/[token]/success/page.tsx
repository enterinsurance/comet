"use client"

import { CheckCircle, Download, Home, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SigningResult {
  documentName: string
  signerName: string
  signedAt: string
  senderName: string
  senderEmail: string
  allSignaturesComplete: boolean
  signatureUrl: string
}

export default function SigningSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [result, setResult] = useState<SigningResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSigningResult = useCallback(async () => {
    try {
      const response = await fetch("/api/sign/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch signing result")
      }

      const data = await response.json()
      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load result")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchSigningResult()
    }
  }, [token, fetchSigningResult])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading signing result...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load signing result</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error || "Failed to load signing information"}
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Document Signed Successfully!</CardTitle>
            <CardDescription className="text-base">
              Your signature has been recorded and saved securely
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Document:</strong>
                  <p className="text-muted-foreground">{result.documentName}</p>
                </div>
                <div>
                  <strong>Signed by:</strong>
                  <p className="text-muted-foreground">{result.signerName}</p>
                </div>
                <div>
                  <strong>Signed on:</strong>
                  <p className="text-muted-foreground">
                    {new Date(result.signedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <strong>Sent by:</strong>
                  <p className="text-muted-foreground">
                    {result.senderName} ({result.senderEmail})
                  </p>
                </div>
              </div>
            </div>

            {result.allSignaturesComplete ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">All Signatures Collected!</h3>
                <p className="text-sm text-green-700">
                  All required signatures have been collected. The document sender will receive a
                  notification with the completed document.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Awaiting Additional Signatures</h3>
                <p className="text-sm text-blue-700">
                  Your signature has been recorded. The document is waiting for additional
                  signatures before completion.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(result.signatureUrl, "_blank")}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Signature
              </Button>
              <Button onClick={() => router.push("/")} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </div>

            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>
                This signature is legally binding and has been recorded with a timestamp and IP
                address for verification purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
