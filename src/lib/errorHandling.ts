/**
 * Comprehensive error handling utilities and types
 * Implements retry mechanisms with exponential backoff and error recovery
 */

// Error types for different categories of failures
export type ErrorType = 
  | 'api' 
  | 'network' 
  | 'validation' 
  | 'authentication'
  | 'rate_limit'
  | 'timeout'
  | 'unknown'

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  retryable: boolean
  retryCount?: number
  originalError?: Error
  context?: Record<string, any>
  timestamp: number
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: ErrorType[]
}

export interface ErrorRecoveryState {
  preservedData?: Record<string, any>
  lastAttempt?: number
  retryCount: number
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: ['network', 'timeout', 'rate_limit', 'api']
}

/**
 * Error classification utility
 */
export class ErrorClassifier {
  static classifyError(error: Error | any): AppError {
    const timestamp = Date.now()
    
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        retryable: true,
        originalError: error,
        timestamp
      }
    }

    // API errors from fetch responses
    if (error.status) {
      switch (error.status) {
        case 401:
          return {
            type: 'authentication',
            message: 'Invalid API key. Please check your OpenRouter API key.',
            code: '401',
            retryable: false,
            originalError: error,
            timestamp
          }
        case 429:
          return {
            type: 'rate_limit',
            message: 'Rate limit exceeded. Please wait before trying again.',
            code: '429',
            retryable: true,
            originalError: error,
            timestamp
          }
        case 408:
        case 504:
          return {
            type: 'timeout',
            message: 'Request timed out. Please try again.',
            code: error.status.toString(),
            retryable: true,
            originalError: error,
            timestamp
          }
        case 500:
        case 502:
        case 503:
          return {
            type: 'api',
            message: 'Server error occurred. Please try again.',
            code: error.status.toString(),
            retryable: true,
            originalError: error,
            timestamp
          }
        default:
          return {
            type: 'api',
            message: `API error: ${error.message || 'Unknown error'}`,
            code: error.status?.toString(),
            retryable: false,
            originalError: error,
            timestamp
          }
      }
    }

    // Validation errors
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return {
        type: 'validation',
        message: error.message,
        retryable: false,
        originalError: error,
        timestamp
      }
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Operation timed out. Please try again.',
        retryable: true,
        originalError: error,
        timestamp
      }
    }

    // Default unknown error
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
      retryable: true,
      originalError: error,
      timestamp
    }
  }

  static isRetryable(error: AppError, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
    return error.retryable && 
           config.retryableErrors.includes(error.type) &&
           (error.retryCount || 0) < config.maxRetries
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryManager {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: AppError | null = null
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const appError = ErrorClassifier.classifyError(error)
        appError.retryCount = attempt
        appError.context = context
        
        lastError = appError

        // Don't retry if not retryable or max attempts reached
        if (!ErrorClassifier.isRetryable(appError, this.config) || attempt === this.config.maxRetries) {
          throw appError
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt)
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt)
    return Math.min(delay, this.config.maxDelay)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Error recovery manager for preserving user input during retries
 */
export class ErrorRecoveryManager {
  private static recoveryStates = new Map<string, ErrorRecoveryState>()

  /**
   * Save user input before attempting an operation
   */
  static preserveUserInput(operationId: string, data: Record<string, any>): void {
    this.recoveryStates.set(operationId, {
      preservedData: data,
      lastAttempt: Date.now(),
      retryCount: 0
    })
  }

  /**
   * Restore user input after a failed operation
   */
  static restoreUserInput(operationId: string): Record<string, any> | null {
    const state = this.recoveryStates.get(operationId)
    return state?.preservedData || null
  }

  /**
   * Update retry count for an operation
   */
  static updateRetryCount(operationId: string): void {
    const state = this.recoveryStates.get(operationId)
    if (state) {
      state.retryCount += 1
      state.lastAttempt = Date.now()
    }
  }

  /**
   * Clear recovery state after successful operation
   */
  static clearRecoveryState(operationId: string): void {
    this.recoveryStates.delete(operationId)
  }

  /**
   * Clean up old recovery states (older than 1 hour)
   */
  static cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    
    for (const [id, state] of this.recoveryStates.entries()) {
      if (state.lastAttempt && state.lastAttempt < oneHourAgo) {
        this.recoveryStates.delete(id)
      }
    }
  }
}

/**
 * Enhanced fetch wrapper with retry logic and error handling
 */
export class ApiClient {
  private retryManager: RetryManager

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryManager = new RetryManager(retryConfig)
  }

  /**
   * Enhanced fetch with retry logic
   */
  async fetch(
    url: string, 
    options: RequestInit = {},
    operationId?: string
  ): Promise<Response> {
    // Set default timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal
    }

    try {
      const response = await this.retryManager.executeWithRetry(
        async () => {
          const res = await fetch(url, fetchOptions)
          
          if (!res.ok) {
            const error = new Error(`HTTP ${res.status}: ${res.statusText}`)
            ;(error as any).status = res.status
            ;(error as any).response = res
            throw error
          }
          
          return res
        },
        { url, method: options.method || 'GET', operationId }
      )

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * JSON fetch with automatic parsing and error handling
   */
  async fetchJson<T>(
    url: string, 
    options: RequestInit = {},
    operationId?: string
  ): Promise<T> {
    const response = await this.fetch(url, options, operationId)
    
    try {
      return await response.json()
    } catch {
      throw new Error('Failed to parse response as JSON')
    }
  }
}

/**
 * Global error handler for unhandled errors
 */
export class GlobalErrorHandler {
  private static errorListeners: ((error: AppError) => void)[] = []

  static initialize(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        const error = ErrorClassifier.classifyError(event.reason)
        this.notifyListeners(error)
      })

      // Handle JavaScript errors
      window.addEventListener('error', (event) => {
        const error = ErrorClassifier.classifyError(event.error)
        this.notifyListeners(error)
      })

      // Cleanup old recovery states periodically
      setInterval(() => {
        ErrorRecoveryManager.cleanup()
      }, 60 * 60 * 1000) // Every hour
    }
  }

  static addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener)
  }

  static removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  private static notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })
  }
}

// Initialize global error handler
if (typeof window !== 'undefined') {
  GlobalErrorHandler.initialize()
}