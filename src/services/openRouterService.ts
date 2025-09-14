/**
 * Enhanced OpenRouter API service with comprehensive error handling and retry mechanisms
 */

import { Model } from '@/lib/types'
import { 
  ApiClient, 
  ErrorRecoveryManager, 
  AppError,
  RetryManager,
  DEFAULT_RETRY_CONFIG
} from '@/lib/errorHandling'
import { apiCache, searchCache } from '@/lib/cacheManager'

export interface OpenRouterModel {
  id: string
  name: string
  description?: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
  top_provider: {
    context_length: number
    max_completion_tokens?: number
  }
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[]
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: OpenRouterMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Enhanced OpenRouter service with error handling and retry mechanisms
 */
export class OpenRouterService {
  private static readonly BASE_URL = 'https://openrouter.ai/api/v1'
  private static readonly MODELS_CACHE_TTL = 60 * 60 * 1000 // 1 hour
  private static readonly SEARCH_CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  
  private apiClient: ApiClient
  private retryManager: RetryManager

  constructor() {
    this.apiClient = new ApiClient({
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    })
    this.retryManager = new RetryManager()
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    const operationId = 'validate_api_key'
    
    try {
      ErrorRecoveryManager.preserveUserInput(operationId, { apiKey })

      const response = await this.apiClient.fetch(
        `${OpenRouterService.BASE_URL}/auth/key`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        },
        operationId
      )

      ErrorRecoveryManager.clearRecoveryState(operationId)
      return response.ok
    } catch (error) {
      const appError = error as AppError
      
      // Authentication errors mean invalid key
      if (appError.type === 'authentication') {
        ErrorRecoveryManager.clearRecoveryState(operationId)
        return false
      }
      
      // For other errors, throw to allow retry
      throw appError
    }
  }

  /**
   * Fetch available models with enhanced caching and error handling
   */
  async fetchModels(apiKey: string, forceRefresh = false): Promise<Model[]> {
    const operationId = 'fetch_models'
    
    // Return cached data if available and not expired
    if (!forceRefresh) {
      const cachedModels = apiCache.getCachedApiResponse<Model[]>('models', { apiKey: 'masked' })
      if (cachedModels) {
        return cachedModels
      }
    }

    try {
      ErrorRecoveryManager.preserveUserInput(operationId, { apiKey, forceRefresh })

      const response = await this.apiClient.fetchJson<OpenRouterModelsResponse>(
        `${OpenRouterService.BASE_URL}/models`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        },
        operationId
      )

      const models = this.transformModels(response.data)
      
      // Cache the results with enhanced cache manager
      apiCache.cacheApiResponse('models', { apiKey: 'masked' }, models, OpenRouterService.MODELS_CACHE_TTL)

      ErrorRecoveryManager.clearRecoveryState(operationId)
      return models
    } catch (error) {
      const appError = error as AppError
      
      // Add context for better error messages
      appError.context = {
        ...appError.context,
        operation: 'fetchModels',
        cacheStats: apiCache.getStats()
      }
      
      throw appError
    }
  }

  /**
   * Search models with query filtering and result caching
   */
  async searchModels(apiKey: string, query: string): Promise<Model[]> {
    // Check cache for search results first
    if (query.trim()) {
      const cachedResults = searchCache.getCachedSearchResults<Model[]>(query)
      if (cachedResults) {
        return cachedResults
      }
    }

    const models = await this.fetchModels(apiKey)
    
    if (!query.trim()) {
      return models
    }

    const lowercaseQuery = query.toLowerCase()
    const filteredModels = models.filter(model =>
      model.name.toLowerCase().includes(lowercaseQuery) ||
      model.provider.toLowerCase().includes(lowercaseQuery) ||
      model.description?.toLowerCase().includes(lowercaseQuery) ||
      model.id.toLowerCase().includes(lowercaseQuery)
    )

    // Cache search results
    searchCache.cacheSearchResults(query, filteredModels, OpenRouterService.SEARCH_CACHE_TTL)

    return filteredModels
  }

  /**
   * Execute chat completion with comprehensive error handling
   */
  async chatCompletion(
    apiKey: string,
    request: OpenRouterRequest
  ): Promise<OpenRouterResponse> {
    const operationId = `chat_completion_${Date.now()}`
    
    try {
      // Preserve request data for retry
      ErrorRecoveryManager.preserveUserInput(operationId, { 
        apiKey, 
        request,
        timestamp: Date.now()
      })

      // Validate request
      this.validateChatRequest(request)

      const response = await this.apiClient.fetchJson<OpenRouterResponse>(
        `${OpenRouterService.BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
            'X-Title': 'Instruct-Lab'
          },
          body: JSON.stringify(request)
        },
        operationId
      )

      // Validate response
      this.validateChatResponse(response)

      ErrorRecoveryManager.clearRecoveryState(operationId)
      return response
    } catch (error) {
      const appError = error as AppError
      
      // Add context for better error handling
      appError.context = {
        ...appError.context,
        operation: 'chatCompletion',
        model: request.model,
        messageCount: request.messages.length,
        maxTokens: request.max_tokens
      }
      
      throw appError
    }
  }

  /**
   * Get cached models without making API call
   */
  getCachedModels(): Model[] | null {
    return apiCache.getCachedApiResponse<Model[]>('models', { apiKey: 'masked' })
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    apiCache.clear()
    searchCache.clear()
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    api: ReturnType<typeof apiCache.getStats>
    search: ReturnType<typeof searchCache.getStats>
  } {
    return {
      api: apiCache.getStats(),
      search: searchCache.getStats()
    }
  }

  /**
   * Get recovery data for a failed operation
   */
  getRecoveryData(operationId: string): Record<string, any> | null {
    return ErrorRecoveryManager.restoreUserInput(operationId)
  }

  /**
   * Transform OpenRouter model format to internal format
   */
  private transformModels(openRouterModels: OpenRouterModel[]): Model[] {
    return openRouterModels
      .filter(model => model.id && model.name) // Filter out invalid models
      .map(model => {
        // Debug pricing for Kimi models
        if (model.name.toLowerCase().includes('kimi')) {
          console.log('Kimi model pricing debug:', {
            name: model.name,
            id: model.id,
            rawPricing: model.pricing,
            promptPrice: model.pricing?.prompt,
            completionPrice: model.pricing?.completion,
            parsedPrompt: parseFloat(model.pricing?.prompt),
            parsedCompletion: parseFloat(model.pricing?.completion)
          })
        }
        
        return {
          id: model.id,
          name: model.name,
          provider: this.extractProvider(model.id),
          contextLength: Number(model.context_length || model.top_provider?.context_length || 4096) || 4096,
          pricing: {
            prompt: parseFloat(model.pricing?.prompt) || 0, // Already per 1K tokens from API
            completion: parseFloat(model.pricing?.completion) || 0 // Already per 1K tokens from API
          },
          description: model.description
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
  }

  /**
   * Extract provider name from model ID
   */
  private extractProvider(modelId: string): string {
    const parts = modelId.split('/')
    if (parts.length >= 2) {
      const provider = parts[0]
      // Capitalize first letter
      return provider.charAt(0).toUpperCase() + provider.slice(1)
    }
    return 'Unknown'
  }

  /**
   * Validate chat completion request
   */
  private validateChatRequest(request: OpenRouterRequest): void {
    if (!request.model) {
      throw new Error('Model is required')
    }
    
    if (!request.messages || request.messages.length === 0) {
      throw new Error('At least one message is required')
    }
    
    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have role and content')
      }
      
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        throw new Error('Invalid message role')
      }
    }
    
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2')
    }
    
    if (request.max_tokens !== undefined && request.max_tokens < 1) {
      throw new Error('Max tokens must be at least 1')
    }
  }

  /**
   * Validate chat completion response
   */
  private validateChatResponse(response: OpenRouterResponse): void {
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices received')
    }
    
    const choice = response.choices[0]
    if (!choice.message || !choice.message.content) {
      throw new Error('Invalid response format')
    }
    
    if (!response.usage) {
      throw new Error('Usage information missing from response')
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService()