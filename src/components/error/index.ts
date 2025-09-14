/**
 * Error handling components for comprehensive error management
 */

export { default as ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary'
export { default as ErrorDisplay } from './ErrorDisplay'
export { default as ApiErrorDisplay } from './ApiErrorDisplay'
export { default as ErrorAwareTestStep } from './ErrorAwareTestStep'
export { default as ErrorAwareSetupStep } from './ErrorAwareSetupStep'

// Re-export error handling utilities
export {
  AppError,
  ErrorType,
  RetryConfig,
  ErrorRecoveryState,
  ErrorClassifier,
  RetryManager,
  ErrorRecoveryManager,
  ApiClient,
  GlobalErrorHandler,
  DEFAULT_RETRY_CONFIG
} from '@/lib/errorHandling'