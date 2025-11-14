"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { errorLog } from "@/lib/logger"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorLog("[ErrorBoundary] Caught an error:", error, errorInfo)

    // In production, you might want to send this to an error reporting service
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      // Additional error reporting can be added here
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. This has been reported and we're working to fix it.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && error && (
          <div className="bg-muted p-4 rounded-lg text-left">
            <h3 className="font-semibold mb-2">Error Details (Development Only):</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
              {error.message}
            </pre>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={resetError} className="w-full">
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  )
}

export default ErrorBoundary