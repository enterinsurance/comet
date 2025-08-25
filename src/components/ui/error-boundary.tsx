"use client"

import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import React, { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: sendToErrorReporting(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  onReset?: () => void
  showDetails?: boolean
}

export function ErrorFallback({ 
  error, 
  onReset, 
  showDetails = process.env.NODE_ENV === "development" 
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Something went wrong
          </h2>
          <p className="text-gray-600">
            We're sorry, but something unexpected happened. Please try again.
          </p>
        </div>

        {showDetails && error && (
          <details className="text-left bg-gray-50 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              Error Details
            </summary>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = "/dashboard"}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

// Specific error boundaries for different parts of the app
export function DocumentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="border rounded-lg p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="font-semibold text-gray-900">Document Error</h3>
            <p className="text-gray-600 text-sm">
              There was a problem loading this document. Please refresh the page or try again later.
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
      }
      onError={(error) => {
        console.error("Document error:", error)
        // Could send to analytics/monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function PDFErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="border rounded-lg p-8 text-center space-y-4 bg-gray-50">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />
          <div>
            <h3 className="font-semibold text-gray-900">PDF Loading Error</h3>
            <p className="text-gray-600 text-sm">
              Unable to display this PDF. The file might be corrupted or in an unsupported format.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
            <Button 
              onClick={() => window.history.back()} 
              variant="ghost"
              size="sm"
            >
              Go Back
            </Button>
          </div>
        </div>
      }
      onError={(error) => {
        console.error("PDF error:", error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}