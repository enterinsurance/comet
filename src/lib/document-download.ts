/**
 * Utility functions for secure document download functionality
 */

export interface DownloadResult {
  success: boolean
  filename?: string
  error?: string
}

/**
 * Download a completed document using the secure API endpoint
 */
export async function downloadCompletedDocument(documentId: string): Promise<DownloadResult> {
  try {
    const response = await fetch(`/api/documents/${documentId}/download`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Download failed" }))
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition")
    let filename = "signed_document.pdf"

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]*)"/)
      if (match) {
        filename = match[1]
      }
    }

    // Create blob and trigger download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return {
      success: true,
      filename,
    }
  } catch (error) {
    console.error("Download error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown download error",
    }
  }
}

/**
 * Check if a document is available for download without downloading it
 */
export async function checkDocumentDownloadAvailability(documentId: string): Promise<{
  available: boolean
  error?: string
}> {
  try {
    const response = await fetch(`/api/documents/${documentId}/download`, {
      method: "HEAD",
    })

    return {
      available: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    console.error("Download availability check error:", error)
    return {
      available: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate a safe filename for document download
 */
export function generateDownloadFilename(
  documentTitle: string,
  suffix: string = "_signed"
): string {
  // Remove unsafe characters and replace with underscores
  const sanitized = documentTitle
    .replace(/[^a-zA-Z0-9\s\-_.]/g, "")
    .replace(/\s+/g, "_")
    .trim()

  // Ensure it's not too long (limit to 100 chars before extension)
  const maxLength = 100 - suffix.length - 4 // -4 for ".pdf"
  const truncated = sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized

  return `${truncated}${suffix}.pdf`
}

/**
 * Get download URL for a document (for email links, etc.)
 */
export function getDocumentDownloadUrl(documentId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "")
  return `${base}/api/documents/${documentId}/download`
}

/**
 * Create a download button handler with consistent error handling
 */
export function createDownloadHandler(
  documentId: string,
  onStart?: () => void,
  onComplete?: (result: DownloadResult) => void,
  onError?: (error: string) => void
) {
  return async () => {
    onStart?.()

    try {
      const result = await downloadCompletedDocument(documentId)

      if (result.success) {
        onComplete?.(result)
      } else {
        onError?.(result.error || "Download failed")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unexpected error occurred"
      onError?.(errorMessage)
    }
  }
}
