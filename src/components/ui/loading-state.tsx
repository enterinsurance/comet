"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BouncingDots, FadeIn, ProgressBar } from "./animations"

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
  showSpinner?: boolean
  variant?: "spinner" | "dots" | "pulse"
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className,
  showSpinner = true,
  variant = "spinner",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const renderLoadingIndicator = () => {
    if (!showSpinner) return null

    switch (variant) {
      case "dots":
        return <BouncingDots size={size} />
      case "pulse":
        return (
          <div className={cn("animate-pulse bg-blue-600 rounded-full", sizeClasses[size])} />
        )
      default:
        return <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
    }
  }

  return (
    <FadeIn>
      <div className={cn("flex items-center justify-center space-x-2", className)}>
        {renderLoadingIndicator()}
        <span className={cn("text-gray-600", textSizeClasses[size])}>{message}</span>
      </div>
    </FadeIn>
  )
}

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({
  isVisible,
  message = "Processing...",
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
      className
    )}>
      <div className="rounded-lg bg-white p-6 shadow-xl">
        <LoadingState message={message} size="lg" />
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit" | "reset"
}

export function LoadingButton({
  isLoading,
  loadingText = "Loading...",
  children,
  className,
  disabled,
  onClick,
  type = "button",
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  )
}

// Document list skeleton
export function DocumentListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// PDF viewer skeleton
export function PDFViewerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}