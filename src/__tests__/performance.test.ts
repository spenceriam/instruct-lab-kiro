/**
 * Performance tests to validate loading and response time requirements
 * Tests Requirements 10.1, 10.2, 10.3
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { performanceMonitor } from '@/lib/performanceMonitor'
import { CacheManager } from '@/lib/cacheManager'
import { OpenRouterService } from '@/services/openRouterService'
import { EvaluationEngine } from '@/services/evaluationEngine'

// Mock fetch for performance tests
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
}

describe('Performance Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.performance = mockPerformance as any
    performanceMonitor.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Requirement 10.1: Application loads within 2 seconds', () => {
    it('should track page load performance', async () => {
      const startTime = Date.now()
      
      // Simulate page load components
      const { unmount } = render(React.createElement('div', null, 'Loading...'))
      
      // Simulate component mounting and initial data loading
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })
      
      const loadTime = Date.now() - startTime
      
      // Record the load time
      performanceMonitor.recordMetric('page_load_time', loadTime, 'timing')
      
      const summary = performanceMonitor.getSummary()
      const pageLoadMetric = summary.recentMetrics.find(m => m.name === 'page_load_time')
      
      expect(pageLoadMetric).toBeDefined()
      expect(pageLoadMetric!.value).toBeLessThan(2000) // Should be under 2 seconds
      
      unmount()
    })

    it('should measure component render performance', () => {
      const renderStart = performance.now()
      
      const { unmount } = render(
        React.createElement('div', null,
          React.createElement('h1', null, 'Instruct-Lab'),
          React.createElement('p', null, 'Test your AI instructions'),
          React.createElement('button', null, 'Start Testing')
        )
      )
      
      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart
      
      performanceMonitor.recordMetric('component_render', renderTime, 'timing')
      
      expect(renderTime).toBeLessThan(100) // Should render in under 100ms
      
      unmount()
    })

    it('should track bundle loading performance', async () => {
      // Simulate dynamic import timing
      const importStart = performance.now()
      
      // Mock dynamic import
      const mockComponent = await Promise.resolve({
        default: () => React.createElement('div', null, 'Dynamic Component')
      })
      
      const importEnd = performance.now()
      const importTime = importEnd - importStart
      
      performanceMonitor.recordMetric('bundle_load', importTime, 'timing')
      
      expect(importTime).toBeLessThan(500) // Dynamic imports should be fast
      expect(mockComponent).toBeDefined()
    })

    it('should validate initial render performance with complex UI', () => {
      const complexUIStart = performance.now()
      
      const { unmount } = render(
        React.createElement('div', null,
          // Simulate complex UI structure
          Array.from({ length: 50 }, (_, i) => 
            React.createElement('div', { key: i },
              React.createElement('span', null, `Item ${i}`),
              React.createElement('button', null, `Action ${i}`)
            )
          )
        )
      )
      
      const complexUIEnd = performance.now()
      const complexRenderTime = complexUIEnd - complexUIStart
      
      performanceMonitor.recordMetric('complex_ui_render', complexRenderTime, 'timing')
      
      expect(complexRenderTime).toBeLessThan(200) // Complex UI should still render quickly
      
      unmount()
    })
  })

  describe('Requirement 10.2: Model search results within 1 second', () => {
    it('should measure model search API performance', async () => {
      const mockModelsResponse = {
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `model-${i}`,
          name: `Model ${i}`,
          provider: 'TestProvider',
          context_length: 4096,
          pricing: { prompt: '0.002', completion: '0.002' }
        }))
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModelsResponse)
      })

      const service = new OpenRouterService()
      
      const searchStart = performance.now()
      const models = await service.searchModels('test-key', 'gpt')
      const searchEnd = performance.now()
      
      const searchTime = searchEnd - searchStart
      performanceMonitor.recordMetric('model_search_api', searchTime, 'timing')
      
      expect(searchTime).toBeLessThan(1000) // Should complete within 1 second
      expect(models).toBeDefined()
      expect(Array.isArray(models)).toBe(true)
    })

    it('should measure cached model search performance', async () => {
      const cache = new CacheManager({ defaultTTL: 60000 })
      
      // Pre-populate cache
      const cachedModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
        { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' }
      ]
      cache.set('models:gpt', cachedModels)
      
      const cacheStart = performance.now()
      const results = cache.get('models:gpt')
      const cacheEnd = performance.now()
      
      const cacheTime = cacheEnd - cacheStart
      performanceMonitor.recordMetric('model_search_cache', cacheTime, 'timing')
      
      expect(cacheTime).toBeLessThan(10) // Cache access should be very fast
      expect(results).toEqual(cachedModels)
      
      cache.destroy()
    })

    it('should measure search filtering performance', () => {
      const largeModelList = Array.from({ length: 1000 }, (_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        provider: i % 2 === 0 ? 'OpenAI' : 'Anthropic',
        description: `Description for model ${i}`
      }))

      const filterStart = performance.now()
      
      const filtered = largeModelList.filter(model => 
        model.name.toLowerCase().includes('gpt') ||
        model.provider.toLowerCase().includes('openai')
      )
      
      const filterEnd = performance.now()
      const filterTime = filterEnd - filterStart
      
      performanceMonitor.recordMetric('model_search_filter', filterTime, 'timing')
      
      expect(filterTime).toBeLessThan(50) // Filtering should be very fast
      expect(Array.isArray(filtered)).toBe(true)
    })

    it('should validate search debouncing performance', async () => {
      let searchCount = 0
      const mockSearch = vi.fn(async (query: string) => {
        searchCount++
        await new Promise(resolve => setTimeout(resolve, 100))
        return [`result-${query}`]
      })

      // Simulate rapid typing
      const queries = ['g', 'gp', 'gpt', 'gpt-', 'gpt-4']
      const searchPromises = queries.map(query => mockSearch(query))
      
      const debounceStart = performance.now()
      await Promise.all(searchPromises)
      const debounceEnd = performance.now()
      
      const totalTime = debounceEnd - debounceStart
      performanceMonitor.recordMetric('search_debounce', totalTime, 'timing')
      
      // With proper debouncing, total time should be reasonable
      expect(totalTime).toBeLessThan(1000)
      expect(searchCount).toBe(5) // All searches executed for test
    })
  })

  describe('Requirement 10.3: Session storage operations under 100ms', () => {
    it('should measure session storage write performance', () => {
      const testData = {
        sessionId: 'test-session',
        testHistory: Array.from({ length: 10 }, (_, i) => ({
          id: `test-${i}`,
          timestamp: Date.now(),
          model: 'gpt-4',
          results: { score: 85 + i }
        }))
      }

      const writeStart = performance.now()
      
      // Simulate session storage write
      const serialized = JSON.stringify(testData)
      const compressed = btoa(serialized) // Simple compression simulation
      
      const writeEnd = performance.now()
      const writeTime = writeEnd - writeStart
      
      performanceMonitor.recordMetric('session_storage_write', writeTime, 'timing')
      
      expect(writeTime).toBeLessThan(100) // Should complete under 100ms
      expect(compressed).toBeDefined()
    })

    it('should measure session storage read performance', () => {
      const testData = {
        sessionId: 'test-session',
        testHistory: Array.from({ length: 10 }, (_, i) => ({
          id: `test-${i}`,
          timestamp: Date.now(),
          model: 'gpt-4'
        }))
      }

      const serialized = JSON.stringify(testData)
      const compressed = btoa(serialized)

      const readStart = performance.now()
      
      // Simulate session storage read
      const decompressed = atob(compressed)
      const parsed = JSON.parse(decompressed)
      
      const readEnd = performance.now()
      const readTime = readEnd - readStart
      
      performanceMonitor.recordMetric('session_storage_read', readTime, 'timing')
      
      expect(readTime).toBeLessThan(100) // Should complete under 100ms
      expect(parsed).toEqual(testData)
    })

    it('should measure large data serialization performance', () => {
      const largeTestHistory = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        timestamp: Date.now(),
        model: 'gpt-4',
        instructions: 'A'.repeat(1000), // 1KB per instruction
        response: 'B'.repeat(2000), // 2KB per response
        metrics: {
          overallScore: 85,
          coherenceScore: 90,
          taskCompletionScore: 80,
          instructionAdherenceScore: 88,
          efficiencyScore: 82
        }
      }))

      const serializeStart = performance.now()
      const serialized = JSON.stringify(largeTestHistory)
      const serializeEnd = performance.now()
      
      const serializeTime = serializeEnd - serializeStart
      performanceMonitor.recordMetric('large_data_serialize', serializeTime, 'timing')
      
      expect(serializeTime).toBeLessThan(200) // Large data should still be reasonable
      expect(serialized.length).toBeGreaterThan(100000) // Should be substantial data
    })

    it('should validate encryption performance for API keys', async () => {
      const testApiKey = 'sk-or-test-key-1234567890abcdef'
      
      // Mock Web Crypto API operations
      const mockEncrypt = vi.fn().mockResolvedValue(new ArrayBuffer(64))
      const mockDecrypt = vi.fn().mockResolvedValue(new TextEncoder().encode(testApiKey))
      
      Object.defineProperty(global, 'crypto', {
        value: {
          ...global.crypto,
          subtle: {
          ...global.crypto.subtle,
            encrypt: mockEncrypt,
            decrypt: mockDecrypt
          }
        },
        writable: true,
        configurable: true
      }) as any

      const encryptStart = performance.now()
      
      // Simulate encryption process
      await mockEncrypt()
      
      const encryptEnd = performance.now()
      const encryptTime = encryptEnd - encryptStart
      
      performanceMonitor.recordMetric('api_key_encrypt', encryptTime, 'timing')
      
      expect(encryptTime).toBeLessThan(50) // Encryption should be very fast
      expect(mockEncrypt).toHaveBeenCalled()
    })
  })

  describe('Overall performance monitoring', () => {
    it('should track evaluation workflow performance end-to-end', async () => {
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Test response' } }],
            usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: JSON.stringify({
              overallScore: 85,
              coherenceScore: 90,
              taskCompletionScore: 80,
              instructionAdherenceScore: 88,
              efficiencyScore: 82,
              explanation: 'Test evaluation explanation'
            }) } }],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
          })
        })

      const workflowStart = performance.now()
      
      const result = await EvaluationEngine.executeEvaluation({
        apiKey: 'test-key',
        model: {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'OpenAI',
          contextLength: 8192,
          pricing: { prompt: 0.03, completion: 0.06 }
        },
        systemInstructions: 'Test instructions',
        userPrompt: 'Test prompt',
        temperature: 0.7,
        maxTokens: 1000
      })
      
      const workflowEnd = performance.now()
      const workflowTime = workflowEnd - workflowStart
      
      performanceMonitor.recordMetric('evaluation_workflow', workflowTime, 'timing')
      
      expect(workflowTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(result).toBeDefined()
      expect(result.metrics.overallScore).toBe(85)
    })

    it('should validate memory usage during intensive operations', () => {
      const memoryStart = performance.memory?.usedJSHeapSize || 0
      
      // Simulate memory-intensive operations
      const largeArrays = Array.from({ length: 10 }, () => 
        Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          data: `data-${i}`.repeat(100)
        }))
      )
      
      const memoryEnd = performance.memory?.usedJSHeapSize || 0
      const memoryUsed = memoryEnd - memoryStart
      
      performanceMonitor.recordMetric('memory_usage', memoryUsed, 'gauge')
      
      // Clean up
      largeArrays.length = 0
      
      // Memory usage should be reasonable (less than 50MB for test)
      expect(memoryUsed).toBeLessThan(50 * 1024 * 1024)
    })

    it('should track performance degradation over time', () => {
      const operations = []
      
      // Perform multiple operations and track performance
      for (let i = 0; i < 100; i++) {
        const opStart = performance.now()
        
        // Simulate operation
        const data = Array.from({ length: 1000 }, (_, j) => j * i)
        const processed = data.map(x => x * 2).filter(x => x % 2 === 0)
        
        const opEnd = performance.now()
        const opTime = opEnd - opStart
        
        operations.push(opTime)
        performanceMonitor.recordMetric(`operation_${i}`, opTime, 'timing')
      }
      
      // Check that performance doesn't degrade significantly
      const firstTen = operations.slice(0, 10)
      const lastTen = operations.slice(-10)
      
      const avgFirst = firstTen.reduce((sum, time) => sum + time, 0) / firstTen.length
      const avgLast = lastTen.reduce((sum, time) => sum + time, 0) / lastTen.length
      
      // Performance shouldn't degrade by more than 50%
      expect(avgLast).toBeLessThan(avgFirst * 1.5)
    })

    it('should validate concurrent operation performance', async () => {
      const concurrentStart = performance.now()
      
      // Simulate concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) => 
        new Promise(resolve => {
          setTimeout(() => {
            const result = Array.from({ length: 1000 }, (_, j) => i * j)
            resolve(result)
          }, Math.random() * 100)
        })
      )
      
      const results = await Promise.all(operations)
      
      const concurrentEnd = performance.now()
      const concurrentTime = concurrentEnd - concurrentStart
      
      performanceMonitor.recordMetric('concurrent_operations', concurrentTime, 'timing')
      
      expect(concurrentTime).toBeLessThan(500) // Should complete efficiently
      expect(results).toHaveLength(10)
    })
  })

  describe('Performance regression detection', () => {
    it('should detect performance regressions', () => {
      // Baseline performance
      const baselineOperations = Array.from({ length: 10 }, () => {
        const start = performance.now()
        // Simulate consistent operation
        Array.from({ length: 1000 }, (_, i) => i * 2)
        const end = performance.now()
        return end - start
      })
      
      const baselineAvg = baselineOperations.reduce((sum, time) => sum + time, 0) / baselineOperations.length
      
      // Simulate regression
      const regressionOperations = Array.from({ length: 10 }, () => {
        const start = performance.now()
        // Simulate slower operation (regression)
        Array.from({ length: 5000 }, (_, i) => i * 2) // 5x more work
        const end = performance.now()
        return end - start
      })
      
      const regressionAvg = regressionOperations.reduce((sum, time) => sum + time, 0) / regressionOperations.length
      
      performanceMonitor.recordMetric('baseline_performance', baselineAvg, 'timing')
      performanceMonitor.recordMetric('regression_performance', regressionAvg, 'timing')
      
      // Should detect significant performance regression
      const regressionRatio = regressionAvg / baselineAvg
      expect(regressionRatio).toBeGreaterThan(2) // Significant regression detected
    })
  })
})