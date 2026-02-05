'use client'

import { Component, ReactNode } from 'react'

interface HydrationErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface HydrationErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class HydrationErrorBoundary extends Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): HydrationErrorBoundaryState {
    // Check if this is a hydration error
    if (error.message.includes('Hydration failed') || error.message.includes('hydration')) {
      return { hasError: true, error }
    }
    return { hasError: false }
  }

  componentDidCatch(error: Error, _errorInfo: unknown) {
    // Log hydration errors for debugging
    if (error.message.includes('Hydration failed') || error.message.includes('hydration')) {
      console.warn('Hydration error caught by boundary:', error.message)
    }
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or retry the component
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-sm text-brand hover:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}



