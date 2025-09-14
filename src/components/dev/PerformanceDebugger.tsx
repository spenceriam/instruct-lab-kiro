/**
 * Performance debugger component for development
 * Only renders in development mode
 */

'use client'

import { useState, useEffect } from 'react'
import { performanceMonitor } from '@/lib/performanceMonitor'
import { apiCache, searchCache } from '@/lib/cacheManager'

interface PerformanceDebuggerProps {
  enabled?: boolean
}

export default function PerformanceDebugger({ enabled = process.env.NODE_ENV === 'development' }: PerformanceDebuggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [webVitals, setWebVitals] = useState<any>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary())
      setWebVitals(performanceMonitor.getWebVitals())
      setCacheStats({
        api: apiCache.getStats(),
        search: searchCache.getStats()
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Performance Debugger"
      >
        📊
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Performance Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Web Vitals */}
          {webVitals && (
            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Web Vitals</h4>
              <div className="space-y-1 text-xs">
                {webVitals.lcp && (
                  <div className="flex justify-between">
                    <span>LCP:</span>
                    <span className={webVitals.lcp > 2500 ? 'text-red-500' : webVitals.lcp > 1200 ? 'text-yellow-500' : 'text-green-500'}>
                      {Math.round(webVitals.lcp)}ms
                    </span>
                  </div>
                )}
                {webVitals.fid && (
                  <div className="flex justify-between">
                    <span>FID:</span>
                    <span className={webVitals.fid > 300 ? 'text-red-500' : webVitals.fid > 100 ? 'text-yellow-500' : 'text-green-500'}>
                      {Math.round(webVitals.fid)}ms
                    </span>
                  </div>
                )}
                {webVitals.fcp && (
                  <div className="flex justify-between">
                    <span>FCP:</span>
                    <span className={webVitals.fcp > 3000 ? 'text-red-500' : webVitals.fcp > 1800 ? 'text-yellow-500' : 'text-green-500'}>
                      {Math.round(webVitals.fcp)}ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Summary */}
          {summary && (
            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Performance</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total Metrics:</span>
                  <span>{summary.totalMetrics}</span>
                </div>
                <div className="flex justify-between">
                  <span>Threshold Violations:</span>
                  <span className={summary.thresholdViolations > 0 ? 'text-red-500' : 'text-green-500'}>
                    {summary.thresholdViolations}
                  </span>
                </div>
                {Object.entries(summary.averages).slice(0, 3).map(([name, value]: [string, any]) => (
                  <div key={name} className="flex justify-between">
                    <span className="truncate">{name.replace(/_/g, ' ')}:</span>
                    <span>{Math.round(value)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cache Stats */}
          {cacheStats && (
            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Cache</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>API Cache:</span>
                  <span>{cacheStats.api.size}/{cacheStats.api.maxSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Search Cache:</span>
                  <span>{cacheStats.search.size}/{cacheStats.search.maxSize}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                performanceMonitor.clear()
                apiCache.clear()
                searchCache.clear()
              }}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clear All
            </button>
            <button
              onClick={() => {
                console.log('Performance Summary:', performanceMonitor.getSummary())
                console.log('Web Vitals:', performanceMonitor.getWebVitals())
                console.log('Cache Stats:', { api: apiCache.getStats(), search: searchCache.getStats() })
              }}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Log to Console
            </button>
          </div>
        </div>
      )}
    </>
  )
}