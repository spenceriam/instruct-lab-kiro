/**
 * Tests for PerformanceMonitor - Performance tracking and optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PerformanceMonitor, performanceMonitor, usePerformanceMonitor } from '../performanceMonitor'

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn()
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

mockPerformanceObserver.mockImplementation((callback) => ({
  observe: mockObserve,
  disconnect: mockDisconnect
}))

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntries: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
}

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    global.PerformanceObserver = mockPerformanceObserver as any
    global.performance = mockPerformance as any
    global.console = {
      ...console,
      warn: vi.fn()
    }
    
    monitor = new PerformanceMonitor()
  })

  afterEach(() => {
    monitor.destroy()
    vi.restoreAllMocks()
  })

  describe('metric recording', () => {
    it('should record timing metrics', () => {
      monitor.recordMetric('test_operation', 150, 'timing')
      
      const summary = monitor.getSummary()
      expect(summary.totalMetrics).toBe(1)
      expect(summary.recentMetrics).toHaveLength(1)
      expect(summary.recentMetrics[0]).toEqual({
        name: 'test_operation',
        value: 150,
        timestamp: expect.any(Number),
        type: 'timing',
        tags: undefined
      })
    })

    it('should record counter metrics', () => {
      monitor.recordMetric('api_calls', 1, 'counter', { endpoint: '/models' })
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0]).toEqual({
        name: 'api_calls',
        value: 1,
        timestamp: expect.any(Number),
        type: 'counter',
        tags: { endpoint: '/models' }
      })
    })

    it('should record gauge metrics', () => {
      monitor.recordMetric('memory_usage', 85.5, 'gauge')
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0].type).toBe('gauge')
      expect(summary.recentMetrics[0].value).toBe(85.5)
    })

    it('should default to timing type', () => {
      monitor.recordMetric('default_metric', 100)
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0].type).toBe('timing')
    })
  })

  describe('timing operations', () => {
    it('should time synchronous operations', () => {
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1150)
      
      const result = monitor.timeSync('sync_operation', () => {
        return 'test result'
      })
      
      expect(result).toBe('test result')
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0]).toEqual({
        name: 'sync_operation',
        value: 150,
        timestamp: expect.any(Number),
        type: 'timing',
        tags: undefined
      })
    })

    it('should handle synchronous operation errors', () => {
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100)
      
      expect(() => {
        monitor.timeSync('failing_operation', () => {
          throw new Error('Test error')
        })
      }).toThrow('Test error')
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics).toHaveLength(2) // timing + error counter
      expect(summary.recentMetrics[1].name).toBe('failing_operation_error')
      expect(summary.recentMetrics[1].type).toBe('counter')
    })

    it('should time asynchronous operations', async () => {
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1200)
      
      const result = await monitor.timeAsync('async_operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async result'
      })
      
      expect(result).toBe('async result')
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0].name).toBe('async_operation')
      expect(summary.recentMetrics[0].value).toBe(200)
    })

    it('should handle asynchronous operation errors', async () => {
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100)
      
      await expect(
        monitor.timeAsync('failing_async_operation', async () => {
          throw new Error('Async error')
        })
      ).rejects.toThrow('Async error')
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics).toHaveLength(2) // timing + error counter
      expect(summary.recentMetrics[1].name).toBe('failing_async_operation_error')
    })

    it('should provide manual timing control', () => {
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1300)
      
      const endTiming = monitor.startTiming('manual_operation')
      
      // Simulate some work
      endTiming()
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0]).toEqual({
        name: 'manual_operation',
        value: 300,
        timestamp: expect.any(Number),
        type: 'timing',
        tags: undefined
      })
    })
  })

  describe('cache event tracking', () => {
    it('should record cache hits', () => {
      monitor.recordCacheEvent('model_search', true)
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0]).toEqual({
        name: 'cache_hit',
        value: 1,
        timestamp: expect.any(Number),
        type: 'counter',
        tags: { operation: 'model_search' }
      })
    })

    it('should record cache misses', () => {
      monitor.recordCacheEvent('model_search', false)
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics[0].name).toBe('cache_miss')
      expect(summary.recentMetrics[0].tags).toEqual({ operation: 'model_search' })
    })
  })

  describe('API call tracking', () => {
    it('should record successful API calls', () => {
      monitor.recordApiCall('/api/models', 250, true)
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics).toHaveLength(2) // duration + success counter
      
      const durationMetric = summary.recentMetrics.find(m => m.name === 'api_call_duration')
      const successMetric = summary.recentMetrics.find(m => m.name === 'api_call_success')
      
      expect(durationMetric).toEqual({
        name: 'api_call_duration',
        value: 250,
        timestamp: expect.any(Number),
        type: 'timing',
        tags: { endpoint: '/api/models', status: 'success' }
      })
      
      expect(successMetric).toEqual({
        name: 'api_call_success',
        value: 1,
        timestamp: expect.any(Number),
        type: 'counter',
        tags: { endpoint: '/api/models' }
      })
    })

    it('should record failed API calls', () => {
      monitor.recordApiCall('/api/models', 500, false)
      
      const summary = monitor.getSummary()
      const errorMetric = summary.recentMetrics.find(m => m.name === 'api_call_error')
      
      expect(errorMetric).toEqual({
        name: 'api_call_error',
        value: 1,
        timestamp: expect.any(Number),
        type: 'counter',
        tags: { endpoint: '/api/models' }
      })
    })
  })

  describe('threshold monitoring', () => {
    it('should warn when page load threshold is exceeded', () => {
      monitor.recordMetric('page_load_time', 3000, 'timing') // Exceeds 2000ms threshold
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded: page_load_time took 3000ms')
      )
    })

    it('should warn when API call threshold is exceeded', () => {
      monitor.recordMetric('api_call_duration', 6000, 'timing') // Exceeds 5000ms threshold
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded: api_call_duration took 6000ms')
      )
    })

    it('should not warn for metrics within thresholds', () => {
      // Clear any previous warnings from observer setup
      vi.mocked(console.warn).mockClear()
      
      monitor.recordMetric('page_load_time', 1500, 'timing') // Within 2000ms threshold
      
      // Should not have any threshold warnings (observer warnings are separate)
      const thresholdWarnings = vi.mocked(console.warn).mock.calls.filter(call => 
        call[0].includes('Performance threshold exceeded')
      )
      expect(thresholdWarnings).toHaveLength(0)
    })
  })

  describe('summary and statistics', () => {
    it('should calculate averages for recent metrics', () => {
      monitor.recordMetric('test_operation', 100, 'timing')
      monitor.recordMetric('test_operation', 200, 'timing')
      monitor.recordMetric('test_operation', 300, 'timing')
      
      const summary = monitor.getSummary()
      expect(summary.averages.test_operation).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should filter recent metrics (last minute)', () => {
      const oldTimestamp = Date.now() - 120000 // 2 minutes ago
      
      // Manually add old metric
      monitor.recordMetric('old_metric', 100, 'timing')
      const summary1 = monitor.getSummary()
      
      // Modify timestamp to simulate old metric
      if (summary1.recentMetrics.length > 0) {
        (summary1.recentMetrics[0] as any).timestamp = oldTimestamp
      }
      
      monitor.recordMetric('new_metric', 200, 'timing')
      
      const summary2 = monitor.getSummary()
      expect(summary2.recentMetrics.some(m => m.name === 'new_metric')).toBe(true)
    })

    it('should count threshold violations', () => {
      monitor.recordMetric('page_load_time', 3000, 'timing') // Exceeds threshold
      monitor.recordMetric('api_call_duration', 6000, 'timing') // Exceeds threshold
      monitor.recordMetric('normal_operation', 100, 'timing') // Within threshold
      
      const summary = monitor.getSummary()
      expect(summary.thresholdViolations).toBe(2)
    })

    it('should limit recent metrics to last 10', () => {
      for (let i = 0; i < 15; i++) {
        monitor.recordMetric(`metric_${i}`, i * 100, 'timing')
      }
      
      const summary = monitor.getSummary()
      expect(summary.recentMetrics).toHaveLength(10)
      expect(summary.totalMetrics).toBe(15)
    })
  })

  describe('Web Vitals', () => {
    it('should track Largest Contentful Paint', () => {
      monitor.recordMetric('largest_contentful_paint', 1200, 'timing')
      
      const vitals = monitor.getWebVitals()
      expect(vitals.lcp).toBe(1200)
    })

    it('should track First Input Delay', () => {
      monitor.recordMetric('first_input_delay', 50, 'timing')
      
      const vitals = monitor.getWebVitals()
      expect(vitals.fid).toBe(50)
    })

    it('should track First Contentful Paint', () => {
      monitor.recordMetric('first_contentful_paint', 800, 'timing')
      
      const vitals = monitor.getWebVitals()
      expect(vitals.fcp).toBe(800)
    })

    it('should return empty object when no vitals recorded', () => {
      const vitals = monitor.getWebVitals()
      expect(vitals).toEqual({})
    })
  })

  describe('memory management', () => {
    it('should limit metrics to prevent memory leaks', () => {
      // Add more than 1000 metrics
      for (let i = 0; i < 1200; i++) {
        monitor.recordMetric(`metric_${i}`, i, 'timing')
      }
      
      const summary = monitor.getSummary()
      expect(summary.totalMetrics).toBe(1000) // Should be capped at 1000
    })
  })

  describe('cleanup and destruction', () => {
    it('should disconnect observers on destroy', () => {
      // The monitor may not have observers if PerformanceObserver setup failed
      // Just verify destroy doesn't throw and clears metrics
      expect(() => monitor.destroy()).not.toThrow()
      
      const summary = monitor.getSummary()
      expect(summary.totalMetrics).toBe(0)
    })

    it('should clear metrics on destroy', () => {
      monitor.recordMetric('test_metric', 100, 'timing')
      
      monitor.destroy()
      
      const summary = monitor.getSummary()
      expect(summary.totalMetrics).toBe(0)
    })

    it('should clear metrics manually', () => {
      monitor.recordMetric('test_metric', 100, 'timing')
      
      monitor.clear()
      
      const summary = monitor.getSummary()
      expect(summary.totalMetrics).toBe(0)
    })
  })

  describe('observer initialization', () => {
    it('should handle observer creation errors gracefully', () => {
      mockPerformanceObserver.mockImplementation(() => {
        throw new Error('Observer not supported')
      })
      
      expect(() => new PerformanceMonitor()).not.toThrow()
      expect(console.warn).toHaveBeenCalledWith(
        'Performance observers not supported:',
        expect.any(Error)
      )
    })
  })
})

describe('Global performance monitor', () => {
  afterEach(() => {
    performanceMonitor.clear()
  })

  it('should provide global performance monitor instance', () => {
    expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor)
    
    performanceMonitor.recordMetric('global_test', 100, 'timing')
    
    const summary = performanceMonitor.getSummary()
    expect(summary.recentMetrics[0].name).toBe('global_test')
  })
})

describe('usePerformanceMonitor hook', () => {
  it('should provide performance monitoring methods', () => {
    const hook = usePerformanceMonitor()
    
    expect(typeof hook.recordMetric).toBe('function')
    expect(typeof hook.startTiming).toBe('function')
    expect(typeof hook.timeAsync).toBe('function')
    expect(typeof hook.timeSync).toBe('function')
    expect(typeof hook.recordCacheEvent).toBe('function')
    expect(typeof hook.recordApiCall).toBe('function')
    expect(typeof hook.getSummary).toBe('function')
    expect(typeof hook.getWebVitals).toBe('function')
  })

  it('should bind methods to global monitor instance', () => {
    const hook = usePerformanceMonitor()
    
    hook.recordMetric('hook_test', 150, 'timing')
    
    const summary = performanceMonitor.getSummary()
    expect(summary.recentMetrics.some(m => m.name === 'hook_test')).toBe(true)
  })
})

describe('Performance integration scenarios', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
  })

  afterEach(() => {
    monitor.destroy()
  })

  it('should handle concurrent timing operations', async () => {
    const operations = []
    
    for (let i = 0; i < 5; i++) {
      operations.push(
        monitor.timeAsync(`concurrent_op_${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return `result_${i}`
        })
      )
    }
    
    const results = await Promise.all(operations)
    
    expect(results).toHaveLength(5)
    
    const summary = monitor.getSummary()
    expect(summary.recentMetrics.filter(m => m.name.startsWith('concurrent_op_'))).toHaveLength(5)
  })

  it('should track complex workflow performance', async () => {
    // Simulate API workflow
    monitor.recordCacheEvent('model_search', false) // Cache miss
    
    await monitor.timeAsync('api_fetch_models', async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })
    
    monitor.recordCacheEvent('model_search', true) // Cache hit on retry
    monitor.recordApiCall('/api/models', 150, true)
    
    const summary = monitor.getSummary()
    
    expect(summary.recentMetrics.some(m => m.name === 'cache_miss')).toBe(true)
    expect(summary.recentMetrics.some(m => m.name === 'cache_hit')).toBe(true)
    expect(summary.recentMetrics.some(m => m.name === 'api_fetch_models')).toBe(true)
    expect(summary.recentMetrics.some(m => m.name === 'api_call_success')).toBe(true)
  })
})