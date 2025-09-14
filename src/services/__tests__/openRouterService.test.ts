/**
 * Tests for OpenRouter service with error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenRouterService } from '../openRouterService'

describe('OpenRouterService', () => {
  let service: OpenRouterService
  
  beforeEach(() => {
    service = new OpenRouterService()
    
    // Mock fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    service.clearCache()
  })

  describe('validateApiKey', () => {
    it('should validate correct API key', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))
      
      const isValid = await service.validateApiKey('valid-key')
      
      expect(isValid).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/auth/key',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-key'
          })
        })
      )
    })

    it('should reject invalid API key', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 }))
      
      const isValid = await service.validateApiKey('invalid-key')
      
      expect(isValid).toBe(false)
    })

    it('should handle network errors during validation', async () => {
      vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))
      
      await expect(service.validateApiKey('test-key')).rejects.toThrow()
    }, 10000)
  })

  describe('fetchModels', () => {
    const mockModelsResponse = {
      data: [
        {
          id: 'openai/gpt-4',
          name: 'GPT-4',
          description: 'Most capable GPT-4 model',
          context_length: 8192,
          pricing: {
            prompt: '0.03',
            completion: '0.06'
          },
          top_provider: {
            context_length: 8192
          }
        },
        {
          id: 'anthropic/claude-3-opus',
          name: 'Claude 3 Opus',
          description: 'Most powerful Claude model',
          context_length: 200000,
          pricing: {
            prompt: '0.015',
            completion: '0.075'
          },
          top_provider: {
            context_length: 200000
          }
        }
      ]
    }

    it('should fetch and transform models correctly', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockModelsResponse), { status: 200 })
      )
      
      const models = await service.fetchModels('valid-key')
      
      expect(models).toHaveLength(2)
      // Models are sorted alphabetically, so Claude comes before GPT
      expect(models[0]).toEqual({
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        contextLength: 200000,
        pricing: { prompt: 0.015, completion: 0.075 },
        description: 'Most powerful Claude model'
      })
      expect(models[1]).toEqual({
        id: 'openai/gpt-4',
        name: 'GPT-4',
        provider: 'Openai',
        contextLength: 8192,
        pricing: { prompt: 0.03, completion: 0.06 },
        description: 'Most capable GPT-4 model'
      })
    })

    it('should cache models and return cached data', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockModelsResponse), { status: 200 })
      )
      
      // First call
      const models1 = await service.fetchModels('valid-key')
      
      // Second call should use cache
      const models2 = await service.fetchModels('valid-key')
      
      expect(models1).toEqual(models2)
      expect(fetch).toHaveBeenCalledTimes(1) // Only called once due to caching
    })

    it('should force refresh when requested', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(new Response(JSON.stringify(mockModelsResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockModelsResponse), { status: 200 }))
      
      // First call
      await service.fetchModels('valid-key')
      
      // Force refresh
      await service.fetchModels('valid-key', true)
      
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle API errors', async () => {
      const errorResponse = new Response('{"error": {"message": "Invalid API key"}}', { 
        status: 401 
      })
      vi.mocked(fetch).mockResolvedValue(errorResponse)
      
      await expect(service.fetchModels('invalid-key')).rejects.toThrow()
    })
  })

  describe('searchModels', () => {
    const mockModels = [
      {
        id: 'openai/gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        contextLength: 8192,
        pricing: { prompt: 0.03, completion: 0.06 },
        description: 'Most capable GPT-4 model'
      },
      {
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        contextLength: 200000,
        pricing: { prompt: 0.015, completion: 0.075 },
        description: 'Most powerful Claude model'
      }
    ]

    beforeEach(() => {
      // Mock fetchModels to return test data
      vi.spyOn(service, 'fetchModels').mockResolvedValue(mockModels)
    })

    it('should return all models when query is empty', async () => {
      const results = await service.searchModels('valid-key', '')
      
      expect(results).toEqual(mockModels)
    })

    it('should filter models by name', async () => {
      const results = await service.searchModels('valid-key', 'GPT')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('GPT-4')
    })

    it('should filter models by provider', async () => {
      const results = await service.searchModels('valid-key', 'anthropic')
      
      expect(results).toHaveLength(1)
      expect(results[0].provider).toBe('Anthropic')
    })

    it('should filter models by description', async () => {
      const results = await service.searchModels('valid-key', 'powerful')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Claude 3 Opus')
    })
  })

  describe('chatCompletion', () => {
    const mockRequest = {
      model: 'openai/gpt-4',
      messages: [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Hello!' }
      ],
      temperature: 0.7,
      max_tokens: 100
    }

    const mockResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'openai/gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant' as const,
            content: 'Hello! How can I help you today?'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 10,
        total_tokens: 30
      }
    }

    it('should make successful chat completion', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      )
      
      const response = await service.chatCompletion('valid-key', mockRequest)
      
      expect(response).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockRequest)
        })
      )
    })

    it('should validate request parameters', async () => {
      const invalidRequest = {
        model: '',
        messages: [],
        temperature: 0.7
      }
      
      await expect(service.chatCompletion('valid-key', invalidRequest)).rejects.toThrow('Model is required')
    })

    it('should validate message format', async () => {
      const invalidRequest = {
        model: 'openai/gpt-4',
        messages: [
          { role: 'invalid' as any, content: 'Hello!' }
        ]
      }
      
      await expect(service.chatCompletion('valid-key', invalidRequest)).rejects.toThrow('Invalid message role')
    })

    it('should validate temperature range', async () => {
      const invalidRequest = {
        ...mockRequest,
        temperature: 3.0 // Invalid temperature
      }
      
      await expect(service.chatCompletion('valid-key', invalidRequest)).rejects.toThrow('Temperature must be between 0 and 2')
    })

    it('should handle API errors', async () => {
      const errorResponse = new Response('{"error": {"message": "Rate limit exceeded"}}', { 
        status: 429 
      })
      vi.mocked(fetch).mockResolvedValue(errorResponse)
      
      await expect(service.chatCompletion('valid-key', mockRequest)).rejects.toThrow()
    }, 10000)

    it('should validate response format', async () => {
      const invalidResponse = {
        id: 'chatcmpl-123',
        choices: [], // Empty choices
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
      }
      
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(invalidResponse), { status: 200 })
      )
      
      await expect(service.chatCompletion('valid-key', mockRequest)).rejects.toThrow('No response choices received')
    })
  })

  describe('cache management', () => {
    it('should return cached models', () => {
      expect(service.getCachedModels()).toBeNull()
      
      // Cache is empty initially
      service.clearCache()
      expect(service.getCachedModels()).toBeNull()
    })

    it('should clear cache', () => {
      service.clearCache()
      expect(service.getCachedModels()).toBeNull()
    })
  })
})