/**
 * Tests for CacheManager - Caching utilities and optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CacheManager, ApiCache, SearchCache, apiCache, searchCache } from '../cacheManager'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({
      defaultTTL: 1000, // 1 second for testing
      maxSize: 3,
      cleanupInterval: 100 // 100ms for testing
    })
  })

  afterEach(() => {
    cache.destroy()
  })

  describe('basic operations', () => {
    it('should set and get cache entries', () => {
      cache.set('key1', 'value1')
      
      expect(cache.get('key1')).toBe('value1')
      expect(cache.has('key1')).toBe(true)
    })

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull()
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('should respect custom TTL', () => {
      cache.set('key1', 'value1', 500) // 500ms TTL
      
      expect(cache.get('key1')).toBe('value1')
    })

    it('should delete entries', () => {
      cache.set('key1', 'value1')
      
      expect(cache.delete('key1')).toBe(true)
      expect(cache.get('key1')).toBeNull()
      expect(cache.delete('nonexistent')).toBe(false)
    })

    it('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      cache.clear()
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
    })
  })

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 50) // 50ms TTL
      
      expect(cache.get('key1')).toBe('value1')
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60))
      
      expect(cache.get('key1')).toBeNull()
    })

    it('should use default TTL when not specified', async () => {
      cache.set('key1', 'value1') // Uses default 1000ms TTL
      
      expect(cache.get('key1')).toBe('value1')
      
      // Should still be valid after 50ms
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(cache.get('key1')).toBe('value1')
    })

    it('should remove expired entries on access', () => {
      const expiredCache = new CacheManager({ defaultTTL: 1 }) // 1ms TTL
      
      expiredCache.set('key1', 'value1')
      
      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          expect(expiredCache.get('key1')).toBeNull()
          expiredCache.destroy()
          resolve(undefined)
        }, 10)
      })
    })
  })

  describe('size limits', () => {
    it('should respect max size limit', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      // Cache should be at max size (3)
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
      
      cache.set('key4', 'value4') // Should evict oldest (key1)
      
      expect(cache.get('key1')).toBeNull() // Evicted
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
      expect(cache.get('key4')).toBe('value4')
    })

    it('should evict oldest entry when full', () => {
      // Fill cache to max size
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      // Verify cache is full
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
      
      // Add one more to trigger eviction
      cache.set('key4', 'value4')
      
      // key1 should be evicted as it's the oldest
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key4')).toBe('value4')
    })
  })

  describe('cleanup operations', () => {
    it('should clean up expired entries', async () => {
      cache.set('key1', 'value1', 50) // 50ms TTL
      cache.set('key2', 'value2', 1000) // 1000ms TTL
      
      // Wait for first entry to expire
      await new Promise(resolve => setTimeout(resolve, 60))
      
      const removedCount = cache.cleanup()
      
      expect(removedCount).toBe(1)
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
    })

    it('should return count of removed entries', () => {
      const expiredCache = new CacheManager({ defaultTTL: 1 })
      
      expiredCache.set('key1', 'value1')
      expiredCache.set('key2', 'value2')
      
      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          const removedCount = expiredCache.cleanup()
          expect(removedCount).toBe(2)
          expiredCache.destroy()
          resolve(undefined)
        }, 10)
      })
    })
  })

  describe('statistics', () => {
    it('should provide cache statistics', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      const stats = cache.getStats()
      
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(3)
      expect(stats.entries).toHaveLength(2)
      expect(stats.entries[0]).toEqual({
        key: 'key1',
        age: expect.any(Number),
        ttl: 1000
      })
    })

    it('should calculate entry ages correctly', async () => {
      cache.set('key1', 'value1')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const stats = cache.getStats()
      
      expect(stats.entries[0].age).toBeGreaterThan(40)
      expect(stats.entries[0].age).toBeLessThan(100)
    })
  })

  describe('destroy', () => {
    it('should clear cache and stop timers on destroy', () => {
      cache.set('key1', 'value1')
      
      cache.destroy()
      
      expect(cache.get('key1')).toBeNull()
    })
  })
})

describe('ApiCache', () => {
  let apiCacheInstance: ApiCache

  beforeEach(() => {
    apiCacheInstance = new ApiCache()
  })

  afterEach(() => {
    apiCacheInstance.destroy()
  })

  describe('API response caching', () => {
    it('should cache API responses with generated keys', () => {
      const endpoint = '/api/models'
      const params = { query: 'gpt', limit: 10 }
      const responseData = { models: ['gpt-4', 'gpt-3.5'] }
      
      apiCacheInstance.cacheApiResponse(endpoint, params, responseData)
      
      const cached = apiCacheInstance.getCachedApiResponse(endpoint, params)
      expect(cached).toEqual(responseData)
    })

    it('should generate consistent cache keys', () => {
      const endpoint = '/api/models'
      const params1 = { query: 'gpt', limit: 10 }
      const params2 = { limit: 10, query: 'gpt' } // Different order
      
      apiCacheInstance.cacheApiResponse(endpoint, params1, 'data1')
      
      // Should find cached data even with different parameter order
      const cached = apiCacheInstance.getCachedApiResponse(endpoint, params2)
      expect(cached).toBe('data1')
    })

    it('should handle empty parameters', () => {
      const endpoint = '/api/status'
      const params = {}
      const responseData = { status: 'ok' }
      
      apiCacheInstance.cacheApiResponse(endpoint, params, responseData)
      
      const cached = apiCacheInstance.getCachedApiResponse(endpoint, params)
      expect(cached).toEqual(responseData)
    })

    it('should respect custom TTL for API responses', () => {
      const endpoint = '/api/models'
      const params = { query: 'gpt' }
      const responseData = { models: ['gpt-4'] }
      
      apiCacheInstance.cacheApiResponse(endpoint, params, responseData, 100) // 100ms TTL
      
      expect(apiCacheInstance.getCachedApiResponse(endpoint, params)).toEqual(responseData)
    })
  })
})

describe('SearchCache', () => {
  let searchCacheInstance: SearchCache

  beforeEach(() => {
    searchCacheInstance = new SearchCache()
  })

  afterEach(() => {
    searchCacheInstance.destroy()
  })

  describe('search result caching', () => {
    it('should cache search results with normalized queries', () => {
      const query = 'GPT Models'
      const results = ['gpt-4', 'gpt-3.5-turbo']
      
      searchCacheInstance.cacheSearchResults(query, results)
      
      const cached = searchCacheInstance.getCachedSearchResults(query)
      expect(cached).toEqual(results)
    })

    it('should normalize queries for consistent caching', () => {
      const results = ['gpt-4', 'gpt-3.5-turbo']
      
      searchCacheInstance.cacheSearchResults('GPT Models', results)
      
      // Different cases and spacing should find same cached result
      expect(searchCacheInstance.getCachedSearchResults('gpt models')).toEqual(results)
      expect(searchCacheInstance.getCachedSearchResults('  GPT   MODELS  ')).toEqual(results)
      expect(searchCacheInstance.getCachedSearchResults('gpt\tmodels')).toEqual(results)
    })

    it('should handle empty queries', () => {
      const results = ['all-models']
      
      searchCacheInstance.cacheSearchResults('', results)
      
      const cached = searchCacheInstance.getCachedSearchResults('')
      expect(cached).toEqual(results)
    })

    it('should respect custom TTL for search results', () => {
      const query = 'test query'
      const results = ['result1', 'result2']
      
      searchCacheInstance.cacheSearchResults(query, results, 100) // 100ms TTL
      
      expect(searchCacheInstance.getCachedSearchResults(query)).toEqual(results)
    })
  })
})

describe('Global cache instances', () => {
  afterEach(() => {
    apiCache.clear()
    searchCache.clear()
  })

  it('should provide global apiCache instance', () => {
    expect(apiCache).toBeInstanceOf(ApiCache)
    
    apiCache.cacheApiResponse('/test', {}, 'data')
    expect(apiCache.getCachedApiResponse('/test', {})).toBe('data')
  })

  it('should provide global searchCache instance', () => {
    expect(searchCache).toBeInstanceOf(SearchCache)
    
    searchCache.cacheSearchResults('test', ['result'])
    expect(searchCache.getCachedSearchResults('test')).toEqual(['result'])
  })
})

describe('Cache integration scenarios', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({
      defaultTTL: 100,
      maxSize: 5,
      cleanupInterval: 50
    })
  })

  afterEach(() => {
    cache.destroy()
  })

  it('should handle rapid cache operations', () => {
    // Simulate rapid API calls
    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, `value${i}`)
    }
    
    // Should only keep last 5 due to size limit (maxSize = 5)
    // The oldest entries (key0-key4) should be evicted
    expect(cache.get('key0')).toBeNull()
    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBeNull()
    expect(cache.get('key3')).toBeNull()
    expect(cache.get('key4')).toBeNull()
    expect(cache.get('key5')).toBe('value5')
    expect(cache.get('key6')).toBe('value6')
    expect(cache.get('key7')).toBe('value7')
    expect(cache.get('key8')).toBe('value8')
    expect(cache.get('key9')).toBe('value9')
  })

  it('should handle mixed TTL scenarios', async () => {
    cache.set('short', 'value1', 50)  // 50ms TTL
    cache.set('medium', 'value2', 100) // 100ms TTL
    cache.set('long', 'value3', 200)   // 200ms TTL
    
    // After 60ms, only short should be expired
    await new Promise(resolve => setTimeout(resolve, 60))
    
    expect(cache.get('short')).toBeNull()
    expect(cache.get('medium')).toBe('value2')
    expect(cache.get('long')).toBe('value3')
    
    // After another 50ms, medium should also be expired
    await new Promise(resolve => setTimeout(resolve, 50))
    
    expect(cache.get('medium')).toBeNull()
    expect(cache.get('long')).toBe('value3')
  })

  it('should handle cache operations during cleanup', async () => {
    cache.set('key1', 'value1', 30) // Short TTL
    
    // Set a longer operation that might conflict with cleanup
    setTimeout(() => {
      cache.set('key2', 'value2')
    }, 40)
    
    await new Promise(resolve => setTimeout(resolve, 80))
    
    expect(cache.get('key1')).toBeNull() // Expired
    expect(cache.get('key2')).toBe('value2') // Should still exist
  })
})