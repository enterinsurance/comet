"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export interface Document {
  id: string
  title: string
  fileName: string
  fileSize: number
  status: string
  createdAt: string
  updatedAt: string
  filePath: string
  _count: {
    signatures: number
    signingRequests: number
  }
}

interface DocumentsResponse {
  documents: Document[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  stats: {
    total: number
    draft: number
    sent: number
    partiallySigned: number
    completed: number
    expired: number
    cancelled: number
  }
}

interface UseDocumentsOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
  autoFetch?: boolean
}

export function useDocuments({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  autoFetch = true,
}: UseDocumentsOptions = {}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    partiallySigned: 0,
    completed: 0,
    expired: 0,
    cancelled: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status }),
      })

      const response = await fetch(`/api/documents?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch documents")
      }

      const data = (await response.json()) as DocumentsResponse
      setDocuments(data.documents)
      setPagination(data.pagination)
      setStats(data.stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch documents"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, status])

  const refetch = useCallback(() => {
    return fetchDocuments()
  }, [fetchDocuments])

  const deleteDocument = useCallback(
    async (documentId: string) => {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to delete document")
        }

        // Remove document from local state
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        toast.success("Document deleted successfully")

        // If current page becomes empty and it's not the first page, go to previous page
        const remainingDocs = documents.length - 1
        if (remainingDocs === 0 && page > 1) {
          // This will trigger a refetch with the new page
          return fetchDocuments()
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete document"
        toast.error(errorMessage)
        throw err
      }
    },
    [documents.length, page, fetchDocuments]
  )

  const addDocument = useCallback((newDocument: Document) => {
    setDocuments((prev) => [newDocument, ...prev])
    setPagination((prev) => ({
      ...prev,
      totalCount: prev.totalCount + 1,
    }))
  }, [])

  // Auto-fetch documents when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchDocuments()
    }
  }, [fetchDocuments, autoFetch])

  // Helper functions for pagination
  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage !== page && newPage >= 1 && newPage <= pagination.totalPages) {
        // This will be handled by the parent component updating the page prop
        return newPage
      }
      return page
    },
    [page, pagination.totalPages]
  )

  const goToNextPage = useCallback(() => {
    return pagination.hasNextPage ? page + 1 : page
  }, [pagination.hasNextPage, page])

  const goToPreviousPage = useCallback(() => {
    return pagination.hasPreviousPage ? page - 1 : page
  }, [pagination.hasPreviousPage, page])

  // Statistics helpers
  const getDocumentStats = useCallback(() => {
    return stats
  }, [stats])

  return {
    documents,
    pagination,
    isLoading,
    error,
    fetchDocuments,
    refetch,
    deleteDocument,
    addDocument,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    getDocumentStats,
  }
}
