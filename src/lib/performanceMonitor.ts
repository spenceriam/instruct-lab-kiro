/**
 * Performance monitoring utilities for tracking and optimizing app performance
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'timing' | 'counter' | 'gauge'
  tags?: Record<string, string>
}

interface PerformanceThresholds {
  pageLoad: number
  apiCall: number
  componentRender: number
  cacheHit: number
}

/**
 * Performance monitor for tracking key metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private thresholds: PerformanceThresholds = {
    pageLoad: 2000, // 2 seconds
    apiCall: 5000, // 5 seconds
    componentRender: 100, // 100ms
    cacheHit: 10 // 10ms
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    try {
      // Navigation timing observer
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.navigationStart, 'timing')
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.navigationStart, 'timing')
            this.recordMetric('first_paint', navEntry.loadEventEnd - navEntry.fetchStart, 'timing')
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)

      // Resource timing observer
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            const resourceType = this.getResourceType(resourceEntry.name)
            
            this.recordMetric(
              `resource_load_${resourceType}`,
              resourceEntry.responseEnd - resourceEntry.startTime,
              'timing',
              { resource: resourceEntry.name }
            )
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)

      // Largest Contentful Paint observer
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('largest_contentful_paint', entry.startTime, 'timing')
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)

      // First Input Delay observer
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming
          this.recordMetric('first_input_delay', fidEntry.processingStart - fidEntry.startTime, 'timing')
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)

    } catch (error) {
      console.warn('Performance observers not supported:', error)
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string, 
    value: number, 
    type: PerformanceMetric['type'] = 'timing',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
      tags
    }

    this.metrics.push(metric)

    // Check thresholds and warn if exceeded
    this.checkThresholds(metric)

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * Start timing a custom operation
   */
  startTiming(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, 'timing')
    }
  }

  /**
   * Time an async operation
   */
  async timeAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const endTiming = this.startTiming(name)
    try {
      const result = await operation()
      endTiming()
      return result
    } catch (error) {
      endTiming()
      this.recordMetric(`${name}_error`, 1, 'counter')
      throw error
    }
  }

  /**
   * Time a synchronous operation
   */
  timeSync<T>(name: string, operation: () => T): T {
    const endTiming = this.startTiming(name)
    try {
      const result = operation()
      endTiming()
      return result
    } catch (error) {
      endTiming()
      this.recordMetric(`${name}_error`, 1, 'counter')
      throw error
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheEvent(operation: string, hit: boolean): void {
    this.recordMetric(`cache_${hit ? 'hit' : 'miss'}`, 1, 'counter', { operation })
  }

  /**
   * Record API call metrics
   */
  recordApiCall(endpoint: string, duration: number, success: boolean): void {
    this.recordMetric('api_call_duration', duration, 'timing', { 
      endpoint, 
      status: success ? 'success' : 'error' 
    })
    this.recordMetric(`api_call_${success ? 'success' : 'error'}`, 1, 'counter', { endpoint })
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number
    averages: Record<string, number>
    thresholdViolations: number
    recentMetrics: PerformanceMetric[]
  } {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000) // Last minute

    const averages: Record<string, number> = {}
    const metricGroups: Record<string, number[]> = {}

    for (const metric of recentMetrics) {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = []
      }
      metricGroups[metric.name].push(metric.value)
    }

    for (const [name, values] of Object.entries(metricGroups)) {
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length
    }

    const thresholdViolations = this.countThresholdViolations()

    return {
      totalMetrics: this.metrics.length,
      averages,
      thresholdViolations,
      recentMetrics: recentMetrics.slice(-10) // Last 10 metrics
    }
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals(): {
    lcp?: number // Largest Contentful Paint
    fid?: number // First Input Delay
    cls?: number // Cumulative Layout Shift
    fcp?: number // First Contentful Paint
    ttfb?: number // Time to First Byte
  } {
    const vitals: any = {}

    const lcpMetric = this.metrics.find(m => m.name === 'largest_contentful_paint')
    if (lcpMetric) vitals.lcp = lcpMetric.value

    const fidMetric = this.metrics.find(m => m.name === 'first_input_delay')
    if (fidMetric) vitals.fid = fidMetric.value

    const fcpMetric = this.metrics.find(m => m.name === 'first_contentful_paint')
    if (fcpMetric) vitals.fcp = fcpMetric.value

    return vitals
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Destroy performance monitor
   */
  destroy(): void {
    for (const observer of this.observers) {
      observer.disconnect()
    }
    this.observers = []
    this.clear()
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    let threshold: number | undefined

    if (metric.name.includes('page_load') || metric.name.includes('navigation')) {
      threshold = this.thresholds.pageLoad
    } else if (metric.name.includes('api_call')) {
      threshold = this.thresholds.apiCall
    } else if (metric.name.includes('render') || metric.name.includes('component')) {
      threshold = this.thresholds.componentRender
    } else if (metric.name.includes('cache')) {
      threshold = this.thresholds.cacheHit
    }

    if (threshold && metric.value > threshold) {
      console.warn(`Performance threshold exceeded: ${metric.name} took ${metric.value}ms (threshold: ${threshold}ms)`)
    }
  }

  /**
   * Count threshold violations in recent metrics
   */
  private countThresholdViolations(): number {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000) // Last 5 minutes
    
    let violations = 0
    for (const metric of recentMetrics) {
      let threshold: number | undefined

      if (metric.name.includes('page_load')) threshold = this.thresholds.pageLoad
      else if (metric.name.includes('api_call')) threshold = this.thresholds.apiCall
      else if (metric.name.includes('render')) threshold = this.thresholds.componentRender

      if (threshold && metric.value > threshold) {
        violations++
      }
    }

    return violations
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image'
    if (url.includes('/api/')) return 'api'
    return 'other'
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    timeAsync: performanceMonitor.timeAsync.bind(performanceMonitor),
    timeSync: performanceMonitor.timeSync.bind(performanceMonitor),
    recordCacheEvent: performanceMonitor.recordCacheEvent.bind(performanceMonitor),
    recordApiCall: performanceMonitor.recordApiCall.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor)
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy()
  })
}