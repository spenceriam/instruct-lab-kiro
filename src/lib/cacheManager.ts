/**
 * Cache Manager for optimizing API calls and data storage
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  lastAccessed: number
  ttl: number
}

export interface CacheConfig {
  defaultTTL: number
  maxSize: number
  cleanupInterval: number
}

/**
 * Generic cache manager with TTL support and automatic cleanup
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupTimer: NodeJS.Timeout | null = null
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 60 * 60 * 1000, // 1 hour default
      maxSize: 100,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      ...config
    }

    this.startCleanupTimer()
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      lastAccessed: now,
      ttl: ttl || this.config.defaultTTL
    }

    // If key already exists, just update it
    if (this.cache.has(key)) {
      this.cache.set(key, entry)
      return
    }

    // Remove oldest entries if cache would exceed max size
    while (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.getOldestKey()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      } else {
        break // Safety break if no oldest key found
      }
    }

    this.cache.set(key, entry)
  }

  /**
   * Get cache entry if not expired (updates lastAccessed for LRU)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    const age = now - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update lastAccessed for LRU tracking, but keep original timestamp for TTL
    entry.lastAccessed = now
    this.cache.set(key, entry)

    return entry.data as T
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    entries: Array<{ key: string; age: number; ttl: number }>
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }))

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      entries
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let removedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        this.cache.delete(key)
        removedCount++
      }
    }

    return removedCount
  }

  /**
   * Get least recently used cache key for eviction (LRU)
   */
  private getOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestAccess = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed
        oldestKey = key
      }
    }

    return oldestKey
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return // Server-side

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

/**
 * Specialized cache for API responses
 */
export class ApiCache extends CacheManager {
  constructor() {
    super({
      defaultTTL: 60 * 60 * 1000, // 1 hour for API responses
      maxSize: 50,
      cleanupInterval: 10 * 60 * 1000 // 10 minutes
    })
  }

  /**
   * Cache API response with automatic key generation
   */
  cacheApiResponse<T>(
    endpoint: string, 
    params: Record<string, any>, 
    data: T, 
    ttl?: number
  ): void {
    const key = this.generateApiKey(endpoint, params)
    this.set(key, data, ttl)
  }

  /**
   * Get cached API response
   */
  getCachedApiResponse<T>(
    endpoint: string, 
    params: Record<string, any>
  ): T | null {
    const key = this.generateApiKey(endpoint, params)
    return this.get<T>(key)
  }

  /**
   * Generate cache key for API calls
   */
  private generateApiKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return `api:${endpoint}:${sortedParams}`
  }
}

/**
 * Specialized cache for search results
 */
export class SearchCache extends CacheManager {
  constructor() {
    super({
      defaultTTL: 30 * 60 * 1000, // 30 minutes for search results
      maxSize: 100,
      cleanupInterval: 5 * 60 * 1000 // 5 minutes
    })
  }

  /**
   * Cache search results with query normalization
   */
  cacheSearchResults<T>(query: string, results: T, ttl?: number): void {
    const normalizedQuery = this.normalizeQuery(query)
    this.set(`search:${normalizedQuery}`, results, ttl)
  }

  /**
   * Get cached search results
   */
  getCachedSearchResults<T>(query: string): T | null {
    const normalizedQuery = this.normalizeQuery(query)
    return this.get<T>(`search:${normalizedQuery}`)
  }

  /**
   * Normalize search query for consistent caching
   */
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ')
  }
}

// Global cache instances
export const apiCache = new ApiCache()
export const searchCache = new SearchCache()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiCache.destroy()
    searchCache.destroy()
  })
}