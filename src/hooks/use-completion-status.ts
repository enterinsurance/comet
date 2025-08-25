"use client"

import { useCallback, useEffect, useState } from "react"

interface CompletionStatus {
  document: {
    id: string
    title: string
    status: string
    finalizedAt?: string | null
    completedDocumentUrl?: string | null
    createdAt: string
    owner: {
      name: string | null
      email: string
    }
  }
  signatures: Array<{
    signerName: string
    signedAt: string
    recipientEmail: string
  }>
  invitations: Array<{
    id: string
    recipientName: string
    recipientEmail: string
    status: string
    signedAt?: string | null
    viewedAt?: string | null
    sentAt?: string | null
    expiresAt: string
  }>
  metrics: {
    totalSignatures: number
    completedSignatures: number
    progressPercentage: number
    isFullyComplete: boolean
    isDocumentFinalized: boolean
  }
  finalizationStatus: {
    isReady: boolean
    isFinalized: boolean
    totalSignatures: number
    completedSignatures: number
    completedDocumentUrl?: string
    finalizedAt?: Date
  }
}

interface UseCompletionStatusReturn {
  completionStatus: CompletionStatus | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage document completion status
 */
export function useCompletionStatus(documentId: string): UseCompletionStatusReturn {
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompletionStatus = useCallback(async () => {
    if (!documentId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/documents/${documentId}/completion-status`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch status" }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data: CompletionStatus = await response.json()
      setCompletionStatus(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("Error fetching completion status:", err)
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  // Initial fetch
  useEffect(() => {
    fetchCompletionStatus()
  }, [fetchCompletionStatus])

  return {
    completionStatus,
    isLoading,
    error,
    refetch: fetchCompletionStatus,
  }
}

/**
 * Hook to automatically poll completion status for active documents
 */
export function useCompletionStatusPolling(
  documentId: string,
  options: {
    enabled?: boolean
    interval?: number
    stopWhenComplete?: boolean
  } = {}
): UseCompletionStatusReturn {
  const {
    enabled = true,
    interval = 10000, // 10 seconds
    stopWhenComplete = true,
  } = options

  const { completionStatus, isLoading, error, refetch } = useCompletionStatus(documentId)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (!enabled || !completionStatus) return

    // Stop polling if document is complete and stopWhenComplete is true
    if (stopWhenComplete && completionStatus.metrics.isDocumentFinalized) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)

    const intervalId = setInterval(() => {
      refetch()
    }, interval)

    return () => {
      clearInterval(intervalId)
      setIsPolling(false)
    }
  }, [enabled, completionStatus, interval, stopWhenComplete, refetch])

  return {
    completionStatus,
    isLoading: isLoading || (isPolling && !completionStatus),
    error,
    refetch,
  }
}

/**
 * Helper hook to get completion status summary
 */
export function useCompletionSummary(documentId: string) {
  const { completionStatus, isLoading, error } = useCompletionStatus(documentId)

  const summary = completionStatus
    ? {
        isComplete: completionStatus.metrics.isDocumentFinalized,
        isReady: completionStatus.metrics.isFullyComplete,
        progressPercentage: completionStatus.metrics.progressPercentage,
        completedCount: completionStatus.metrics.completedSignatures,
        totalCount: completionStatus.metrics.totalSignatures,
        pendingCount:
          completionStatus.metrics.totalSignatures - completionStatus.metrics.completedSignatures,
        hasDownloadUrl: !!completionStatus.document.completedDocumentUrl,
        lastSignedAt:
          completionStatus.signatures.length > 0
            ? completionStatus.signatures[completionStatus.signatures.length - 1].signedAt
            : null,
        finalizedAt: completionStatus.document.finalizedAt,
      }
    : null

  return {
    summary,
    isLoading,
    error,
  }
}
