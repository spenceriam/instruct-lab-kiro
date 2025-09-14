'use client'

import { useState, useEffect } from 'react'
import { AppError } from '@/lib/errorHandling'
import ErrorDisplay from './ErrorDisplay'
import { ArrowClockwise, X } from 'phosphor-react'

interface ApiErrorDisplayProps {
  error: AppError | null
  onRetry?: () => void
  onDismiss?: () => void
  autoRetry?: boolean
  autoRetryDelay?: number
  preserveInput?: boolean
  className?: string
}

/**
 * Specialized error display for API operations with auto-retry functionality
 */
export default function ApiErrorDisplay({
  error,
  onRetry,
  onDismiss,
  autoRetry = false,
  autoRetryDelay = 5000,
  preserveInput = true,
  className = ''
}: ApiErrorDisplayProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (!error || !autoRetry || !error.retryable || !onRetry) {
      setCountdown(null)
      return
    }

    // Don't auto-retry authentication or validation errors
    if (error.type === 'authentication' || error.type === 'validation') {
      return
    }

    // Start countdown for auto-retry
    let timeLeft = Math.ceil(autoRetryDelay / 1000)
    setCountdown(timeLeft)

    const interval = setInterval(() => {
      timeLeft -= 1
      setCountdown(timeLeft)

      if (timeLeft <= 0) {
        clearInterval(interval)
        setCountdown(null)
        handleAutoRetry()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [error, autoRetry, autoRetryDelay, onRetry])

  const handleAutoRetry = async () => {
    if (!onRetry) return

    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const handleManualRetry = async () => {
    if (!onRetry) return

    // Cancel auto-retry countdown
    setCountdown(null)
    setIsRetrying(true)
    
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDismiss = () => {
    setCountdown(null)
    onDismiss?.()
  }

  if (!error) return null

  // Show loading state during retry
  if (isRetrying) {
    return (
      <div className={`border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Retrying operation...
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {preserveInput ? 'Your input has been preserved.' : 'Please wait...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <ErrorDisplay
        error={error}
        onRetry={handleManualRetry}
        onDismiss={handleDismiss}
        showDetails={process.env.NODE_ENV === 'development'}
      />
      
      {/* Auto-retry countdown */}
      {countdown !== null && countdown > 0 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowClockwise size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Auto-retry in {countdown} second{countdown !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRetry}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry Now
              </button>
              <button
                onClick={() => setCountdown(null)}
                className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1">
            <div 
              className="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-1000 ease-linear"
              style={{ 
                width: `${((autoRetryDelay / 1000 - countdown) / (autoRetryDelay / 1000)) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}