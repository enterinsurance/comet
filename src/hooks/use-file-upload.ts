"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

interface UploadedDocument {
  id: string
  title: string
  fileName: string
  fileSize: number
  status: string
  createdAt: string
  url: string
}

interface UseFileUploadOptions {
  onSuccess?: (document: UploadedDocument) => void
  onError?: (error: string) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedDocument | null> => {
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append("file", file)

        // Simulate progress for user feedback
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const errorData = await response.json()
          const errorMessage = errorData.error || "Upload failed"
          throw new Error(errorMessage)
        }

        const document = (await response.json()) as UploadedDocument

        toast.success(`Successfully uploaded ${file.name}`)
        options.onSuccess?.(document)

        return document
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed"
        toast.error(`Upload failed: ${errorMessage}`)
        options.onError?.(errorMessage)
        return null
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [options]
  )

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadedDocument[]> => {
      const results: UploadedDocument[] = []

      for (const file of files) {
        const result = await uploadFile(file)
        if (result) {
          results.push(result)
        }
      }

      return results
    },
    [uploadFile]
  )

  return {
    uploadFile,
    uploadFiles,
    isUploading,
    uploadProgress,
  }
}
