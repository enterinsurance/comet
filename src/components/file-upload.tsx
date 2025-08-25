"use client"

import { AlertCircle, File, Upload, X } from "lucide-react"
import { type DragEvent, useCallback, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  maxSize?: number // in MB
  maxFiles?: number
  accept?: string
  className?: string
}

interface UploadError {
  message: string
  type: "size" | "type" | "count"
}

export function FileUpload({
  onFileSelect,
  maxSize = 10, // 10MB default
  maxFiles = 1,
  accept = ".pdf",
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<UploadError[]>([])

  const validateFile = useCallback(
    (file: File): UploadError | null => {
      // Check file type
      if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
        return { message: "Only PDF files are allowed", type: "type" }
      }

      // Check file size (convert MB to bytes)
      const maxSizeBytes = maxSize * 1024 * 1024
      if (file.size > maxSizeBytes) {
        return {
          message: `File size must be less than ${maxSize}MB`,
          type: "size",
        }
      }

      return null
    },
    [maxSize]
  )

  const validateFiles = useCallback(
    (files: File[]): { validFiles: File[]; errors: UploadError[] } => {
      const validFiles: File[] = []
      const newErrors: UploadError[] = []

      // Check file count
      if (files.length > maxFiles) {
        newErrors.push({
          message: `Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`,
          type: "count",
        })
        return { validFiles: [], errors: newErrors }
      }

      // Validate each file
      files.forEach((file) => {
        const error = validateFile(file)
        if (error) {
          newErrors.push(error)
        } else {
          validFiles.push(file)
        }
      })

      return { validFiles, errors: newErrors }
    },
    [maxFiles, validateFile]
  )

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const { validFiles, errors: validationErrors } = validateFiles(fileArray)

      setErrors(validationErrors)

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles)
        onFileSelect(validFiles)
      }
    },
    [validateFiles, onFileSelect]
  )

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const { files } = e.dataTransfer
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index)
      setSelectedFiles(newFiles)
      onFileSelect(newFiles)
      setErrors([])
    },
    [selectedFiles, onFileSelect]
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary/50 hover:bg-primary/5"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <input
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />

          <Upload className="h-12 w-12 text-muted-foreground mb-4" />

          <div className="space-y-2">
            <p className="text-sm font-medium">Drag and drop your PDF files here</p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Choose Files
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>Maximum file size: {maxSize}MB</p>
            <p>Accepted format: PDF</p>
            {maxFiles > 1 && <p>Maximum files: {maxFiles}</p>}
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
