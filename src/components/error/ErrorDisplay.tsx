'use client'

import React, { useState } from 'react'
import { AppError } from '@/lib/errorHandling'
import { 
  Warning, 
  ArrowClockwise, 
  WifiSlash, 
  Key, 
  Clock, 
  Bug,
  CaretDown,
  CaretUp,
  Copy,
  CheckCircle
} from 'phosphor-react'

interface ErrorDisplayProps {
  error: AppError
  onRetry?: () => void
  onDismiss?: () => void
  showDetails?: boolean
  compact?: boolean
  className?: string
}

/**
 * Comprehensive error display component with retry functionality
 */
export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false,
  className = ''
}: ErrorDisplayProps) {
  const [showFullDetails, setShowFullDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiSlash size={compact ? 16 : 20} className="text-red-500" />
      case 'authentication':
        return <Key size={compact ? 16 : 20} className="text-yellow-500" />
      case 'timeout':
        return <Clock size={compact ? 16 : 20} className="text-orange-500" />
      case 'rate_limit':
        return <Clock size={compact ? 16 : 20} className="text-blue-500" />
      case 'validation':
        return <Warning size={compact ? 16 : 20} className="text-yellow-500" />
      default:
        return <Bug size={compact ? 16 : 20} className="text-red-500" />
    }
  }

  const getErrorColor = () => {
    switch (error.type) {
      case 'network':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
      case 'authentication':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
      case 'timeout':
      case 'rate_limit':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
      case 'validation':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
      default:
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
    }
  }

  const getRetryDelay = () => {
    if (error.type === 'rate_limit') {
      return 'Please wait 30-60 seconds before retrying.'
    }
    if (error.retryCount && error.retryCount > 0) {
      const delay = Math.pow(2, error.retryCount) * 1000
      return `Retry available in ${Math.ceil(delay / 1000)} seconds.`
    }
    return null
  }

  const getSuggestions = () => {
    switch (error.type) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable any VPN or proxy temporarily'
        ]
      case 'authentication':
        return [
          'Verify your OpenRouter API key is correct',
          'Check if your API key has sufficient credits',
          'Ensure your API key has the required permissions'
        ]
      case 'rate_limit':
        return [
          'Wait a few minutes before trying again',
          'Consider upgrading your OpenRouter plan',
          'Try using a different model with lower usage'
        ]
      case 'timeout':
        return [
          'Try again with a shorter prompt',
          'Check your internet connection stability',
          'Consider using a faster model'
        ]
      case 'validation':
        return [
          'Check your input for any invalid characters',
          'Ensure all required fields are filled',
          'Verify the format matches requirements'
        ]
      default:
        return [
          'Try refreshing the page',
          'Clear your browser cache',
          'Contact support if the issue persists'
        ]
    }
  }

  const copyErrorDetails = async () => {
    const details = {
      type: error.type,
      message: error.message,
      code: error.code,
      timestamp: new Date(error.timestamp).toISOString(),
      retryCount: error.retryCount,
      context: error.context
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded border ${getErrorColor()} ${className}`}>
        {getErrorIcon()}
        <span className="text-sm flex-1">{error.message}</span>
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${getErrorColor()} ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {getErrorIcon()}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">
              {error.type === 'network' && 'Connection Error'}
              {error.type === 'authentication' && 'Authentication Error'}
              {error.type === 'timeout' && 'Request Timeout'}
              {error.type === 'rate_limit' && 'Rate Limit Exceeded'}
              {error.type === 'validation' && 'Validation Error'}
              {error.type === 'api' && 'API Error'}
              {error.type === 'unknown' && 'Unexpected Error'}
            </h3>
            {showDetails && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {error.message}
              </p>
            )}
            
            {/* Retry delay info */}
            {getRetryDelay() && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {getRetryDelay()}
              </p>
            )}
          </div>
          
          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ×
            </button>
          )}
        </div>

        {/* Suggestions */}
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Try these solutions:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowClockwise size={14} />
              Try Again
            </button>
          )}
          
          {showDetails && (
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {showFullDetails ? <CaretUp size={12} /> : <CaretDown size={12} />}
              {showFullDetails ? 'Hide' : 'Show'} Details
            </button>
          )}
        </div>

        {/* Detailed error information */}
        {showDetails && showFullDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Error Details
              </h4>
              <button
                onClick={copyErrorDetails}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle size={12} className="text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
              <div className="space-y-1">
                <div><span className="text-gray-500">Type:</span> {error.type}</div>
                {error.code && <div><span className="text-gray-500">Code:</span> {error.code}</div>}
                <div><span className="text-gray-500">Time:</span> {new Date(error.timestamp).toLocaleString()}</div>
                {error.retryCount !== undefined && (
                  <div><span className="text-gray-500">Retry Count:</span> {error.retryCount}</div>
                )}
                {error.context && (
                  <div>
                    <span className="text-gray-500">Context:</span>
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}