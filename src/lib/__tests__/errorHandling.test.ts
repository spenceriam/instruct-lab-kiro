/**
 * Tests for error handling utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ErrorClassifier,
  RetryManager,
  ErrorRecoveryManager,
  ApiClient,
  DEFAULT_RETRY_CONFIG,
  AppError
} from '../errorHandling'

describe('ErrorClassifier', () => {
  it('should classify network errors correctly', () => {
    const networkError = new TypeError('Failed to fetch')
    const classified = ErrorClassifier.classifyError(networkError)
    
    expect(classified.type).toBe('network')
    expect(classified.retryable).toBe(true)
    expect(classified.message).toContain('Network connection failed')
  })

  it('should classify API errors correctly', () => {
    const apiError = new Error('API Error')
    ;(apiError as any).status = 500
    
    const classified = ErrorClassifier.classifyError(apiError)
    
    expect(classified.type).toBe('api')
    expect(classified.retryable).toBe(true)
    expect(classified.code).toBe('500')
  })

  it('should classify authentication errors correctly', () => {
    const authError = new Error('Unauthorized')
    ;(authError as any).status = 401
    
    const classified = ErrorClassifier.classifyError(authError)
    
    expect(classified.type).toBe('authentication')
    expect(classified.retryable).toBe(false)
    expect(classified.code).toBe('401')
  })

  it('should classify rate limit errors correctly', () => {
    const rateLimitError = new Error('Too Many Requests')
    ;(rateLimitError as any).status = 429
    
    const classified = ErrorClassifier.classifyError(rateLimitError)
    
    expect(classified.type).toBe('rate_limit')
    expect(classified.retryable).toBe(true)
    expect(classified.code).toBe('429')
  })

  it('should determine if error is retryable', () => {
    const retryableError: AppError = {
      type: 'network',
      message: 'Network error',
      retryable: true,
      timestamp: Date.now(),
      retryCount: 1
    }
    
    const nonRetryableError: AppError = {
      type: 'authentication',
      message: 'Auth error',
      retryable: false,
      timestamp: Date.now()
    }
    
    expect(ErrorClassifier.isRetryable(retryableError)).toBe(true)
    expect(ErrorClassifier.isRetryable(nonRetryableError)).toBe(false)
  })

  it('should not retry if max retries exceeded', () => {
    const error: AppError = {
      type: 'network',
      message: 'Network error',
      retryable: true,
      timestamp: Date.now(),
      retryCount: 5
    }
    
    expect(ErrorClassifier.isRetryable(error, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 })).toBe(false)
  })
})

describe('RetryManager', () => {
  let retryManager: RetryManager
  
  beforeEach(() => {
    retryManager = new RetryManager({
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      retryableErrors: ['network', 'api']
    })
  })

  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    
    const result = await retryManager.executeWithRetry(operation)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue('success')
    
    const result = await retryManager.executeWithRetry(operation)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable errors', async () => {
    const authError = new Error('Unauthorized')
    ;(authError as any).status = 401
    
    const operation = vi.fn().mockRejectedValue(authError)
    
    await expect(retryManager.executeWithRetry(operation)).rejects.toThrow()
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should respect max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    
    await expect(retryManager.executeWithRetry(operation)).rejects.toThrow()
    expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })
})

describe('ErrorRecoveryManager', () => {
  beforeEach(() => {
    // Clear any existing recovery states
    ErrorRecoveryManager.cleanup()
  })

  it('should preserve and restore user input', () => {
    const operationId = 'test_operation'
    const userData = { prompt: 'test prompt', model: 'gpt-4' }
    
    ErrorRecoveryManager.preserveUserInput(operationId, userData)
    const restored = ErrorRecoveryManager.restoreUserInput(operationId)
    
    expect(restored).toEqual(userData)
  })

  it('should update retry count', () => {
    const operationId = 'test_operation'
    const userData = { prompt: 'test prompt' }
    
    ErrorRecoveryManager.preserveUserInput(operationId, userData)
    ErrorRecoveryManager.updateRetryCount(operationId)
    ErrorRecoveryManager.updateRetryCount(operationId)
    
    // We can't directly access retry count, but we can verify the state exists
    const restored = ErrorRecoveryManager.restoreUserInput(operationId)
    expect(restored).toEqual(userData)
  })

  it('should clear recovery state', () => {
    const operationId = 'test_operation'
    const userData = { prompt: 'test prompt' }
    
    ErrorRecoveryManager.preserveUserInput(operationId, userData)
    ErrorRecoveryManager.clearRecoveryState(operationId)
    
    const restored = ErrorRecoveryManager.restoreUserInput(operationId)
    expect(restored).toBeNull()
  })
})

describe('ApiClient', () => {
  let apiClient: ApiClient
  
  beforeEach(() => {
    apiClient = new ApiClient({
      maxRetries: 2,
      baseDelay: 10,
      maxDelay: 100,
      backoffMultiplier: 2,
      retryableErrors: ['network', 'api']
    })
    
    // Mock fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should make successful requests', async () => {
    const mockResponse = new Response('{"data": "test"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
    vi.mocked(fetch).mockResolvedValue(mockResponse)
    
    const response = await apiClient.fetch('https://api.example.com/test')
    
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should retry on network errors', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(new Response('{"data": "test"}', { status: 200 }))
    
    const response = await apiClient.fetch('https://api.example.com/test')
    
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should handle timeout', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100)
      })
    )
    
    await expect(apiClient.fetch('https://api.example.com/test')).rejects.toThrow()
  }, 10000)

  it('should parse JSON responses', async () => {
    const mockData = { message: 'success' }
    const mockResponse = new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
    vi.mocked(fetch).mockResolvedValue(mockResponse)
    
    const data = await apiClient.fetchJson('https://api.example.com/test')
    
    expect(data).toEqual(mockData)
  })

  it('should handle JSON parsing errors', async () => {
    const mockResponse = new Response('invalid json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
    vi.mocked(fetch).mockResolvedValue(mockResponse)
    
    await expect(apiClient.fetchJson('https://api.example.com/test')).rejects.toThrow('Failed to parse response as JSON')
  })
})