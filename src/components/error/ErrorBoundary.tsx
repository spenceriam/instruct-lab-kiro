'use client'

import React, { Component, ReactNode } from 'react'
import { AppError, ErrorClassifier } from '@/lib/errorHandling'
import ErrorDisplay from './ErrorDisplay'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (props: { error: Error; resetError: () => void }) => ReactNode
  onError?: (error: AppError) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  errorId: string | null
}

/**
 * Error boundary component that catches JavaScript errors and displays user-friendly error messages
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = ErrorClassifier.classifyError(error)
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error: appError,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = ErrorClassifier.classifyError(error)
    appError.context = {
      ...appError.context,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    }

    // Log error for debugging (match test expectations)
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Notify parent component
    this.props.onError?.(appError)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    // Reset error state if props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }

    // Reset error state if any reset keys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      )
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorId: null
    })
  }

  handleRetry = () => {
    const { error } = this.state
    
    if (error && error.retryable) {
      // Add a small delay before retrying to prevent rapid retries
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary()
      }, 500)
    } else {
      this.resetErrorBoundary()
    }
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback({ error: error.originalError || new Error(error.message), resetError: this.handleRetry })
      }

      // Default error display
      return (
        <ErrorDisplay
          error={error}
          onRetry={this.handleRetry}
          showDetails={process.env.NODE_ENV !== 'production'}
        />
      )
    }

    return children
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for manually triggering error boundary
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}