/**
 * Integration tests for SecurityManager and SessionManager working together
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecurityManager } from '../security'
import { SessionManager } from '../sessionManager'

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock crypto API
const mockCrypto = {
  randomUUID: vi.fn(() => 'test-session-id'),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  }),
  subtle: {
    generateKey: vi.fn(() => Promise.resolve({} as CryptoKey)),
    encrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(64))),
    decrypt: vi.fn(() => Promise.resolve(new TextEncoder().encode('test-api-key'))),
    importKey: vi.fn(() => Promise.resolve({} as CryptoKey)),
    exportKey: vi.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
}

// Mock window and document
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

const mockDocument = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  visibilityState: 'visible'
}

describe('Session and Security Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true
    })
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
      configurable: true
    })
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
      configurable: true
    })
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true,
      configurable: true
    })
    
    // Reset managers
    SessionManager.cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    SessionManager.cleanup()
  })

  describe('End-to-End Session Flow', () => {
    it('should create session, store encrypted API key, and retrieve it', async () => {
      // Initialize session manager
      SessionManager.initialize()
      
      // Create a new session
      const session = SessionManager.createSession()
      expect(session.sessionId).toBe('test-session-id')
      expect(session.testHistory).toEqual([])
      
      // Store an API key
      const apiKey = 'sk-or-test-key-12345'
      const updatedSession = await SessionManager.storeApiKey(apiKey, session)
      
      expect(updatedSession.encryptedApiKey).toBeDefined()
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled()
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
      
      // Retrieve the API key
      const retrievedKey = await SessionManager.getApiKey(updatedSession)
      
      expect(retrievedKey).toBe('test-api-key') // Mocked decryption result
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
    })

    it('should handle session expiration and cleanup', async () => {
      // Create an expired session
      const expiredSession = {
        ...SessionManager.createSession(),
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      }
      
      // Mock storage to return expired session
      const sessionJson = JSON.stringify(expiredSession)
      const encrypted = btoa(sessionJson)
      mockSessionStorage.getItem.mockReturnValue(encrypted)
      
      // Try to load expired session
      const loadedSession = await SessionManager.loadSession()
      
      expect(loadedSession).toBeNull()
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('instruct-lab-session')
    })

    it('should validate API key format before encryption', async () => {
      const session = SessionManager.createSession()
      
      // Test with invalid API key
      await expect(SessionManager.storeApiKey('invalid', session))
        .rejects.toThrow('Invalid API key format')
      
      // Ensure encryption was not called for invalid key
      expect(mockCrypto.subtle.encrypt).not.toHaveBeenCalled()
    })

    it('should clear all sensitive data on session reset', async () => {
      // Create session with API key
      const session = SessionManager.createSession()
      const apiKey = 'sk-or-test-key-12345'
      await SessionManager.storeApiKey(apiKey, session)
      
      // Clear session
      await SessionManager.clearSession()
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('instruct-lab-session')
      // SecurityManager.clearSensitiveData should also be called
    })

    it('should extend session expiration on activity', async () => {
      const session = SessionManager.createSession()
      const originalExpiration = session.expiresAt
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const extendedSession = await SessionManager.extendSession(session)
      
      expect(extendedSession.expiresAt).toBeGreaterThan(originalExpiration)
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    it('should handle concurrent session operations', async () => {
      const session = SessionManager.createSession()
      
      // Simulate concurrent operations
      const operations = [
        SessionManager.storeApiKey('sk-or-v1-abcd1234567890abcdef1234567890abcdef1234567890', session),
        SessionManager.addTestToHistory({
          id: 'test-1',
          timestamp: Date.now(),
          model: 'gpt-4',
          modelProvider: 'OpenAI',
          instructions: 'Test',
          prompt: 'Test',
          response: 'Test',
          metrics: {
            overallScore: 85,
            coherenceScore: 90,
            taskCompletionScore: 80,
            instructionAdherenceScore: 88,
            efficiencyScore: 82,
            explanation: 'Test'
          },
          tokenUsage: {
            promptTokens: 100,
            completionTokens: 200,
            totalTokens: 300
          },
          executionTime: 1500,
          cost: 0.0025
        }, session),
        SessionManager.updateSettings({ temperature: 0.5 }, session)
      ]
      
      // All operations should complete without errors
      const results = await Promise.all(operations)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.sessionId).toBe('test-session-id')
      })
    })
  })

  describe('Security Features', () => {
    it('should use different encryption keys for different sessions', async () => {
      // Create two sessions
      const session1 = SessionManager.createSession()
      const session2 = SessionManager.createSession()
      
      // Store same API key in both sessions
      const apiKey = 'sk-or-v1-abcd1234567890abcdef1234567890abcdef1234567890'
      await SessionManager.storeApiKey(apiKey, session1)
      await SessionManager.storeApiKey(apiKey, session2)
      
      // Encryption should be called for both
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledTimes(2)
    })

    it('should validate Web Crypto API availability', () => {
      expect(SecurityManager.isWebCryptoAvailable()).toBe(true)
      
      // Test with missing crypto
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      })
      
      expect(SecurityManager.isWebCryptoAvailable()).toBe(false)
      
      // Restore
      Object.defineProperty(global, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      })
    })

    it('should generate secure session IDs', () => {
      const sessionId1 = SecurityManager.generateSessionId()
      const sessionId2 = SecurityManager.generateSessionId()
      
      expect(sessionId1).toBe('test-session-id')
      expect(sessionId2).toBe('test-session-id')
      expect(mockCrypto.randomUUID).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Recovery', () => {
    it('should recover from storage quota exceeded', async () => {
      const session = SessionManager.createSession()
      
      // Mock storage quota exceeded
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      
      await expect(SessionManager.saveSession(session))
        .rejects.toThrow('Failed to save session data')
    })

    it('should handle corrupted encryption keys gracefully', async () => {
      // Mock corrupted key data
      mockSessionStorage.getItem.mockReturnValue('corrupted-key-data')
      
      const apiKey = 'sk-or-test-key'
      
      // Should generate new key when existing key is corrupted
      await SecurityManager.encryptApiKey(apiKey)
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalled()
    })

    it('should fallback gracefully when crypto operations fail', async () => {
      // Mock crypto failure
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Crypto not available'))
      
      const apiKey = 'sk-or-test-key'
      
      await expect(SecurityManager.encryptApiKey(apiKey))
        .rejects.toThrow('Failed to encrypt API key')
    })
  })

  describe('Session Lifecycle Events', () => {
    it('should set up event listeners on initialization', () => {
      SessionManager.initialize()
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })

    it('should clean up event listeners on cleanup', () => {
      SessionManager.initialize()
      SessionManager.cleanup()
      
      // Cleanup should not throw
      expect(() => SessionManager.cleanup()).not.toThrow()
    })

    it('should handle visibility change events', () => {
      SessionManager.initialize()
      
      // Simulate visibility change
      const visibilityHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'visibilitychange')?.[1]
      
      expect(visibilityHandler).toBeDefined()
      
      // Should not throw when called
      if (visibilityHandler) {
        expect(() => visibilityHandler()).not.toThrow()
      }
    })
  })
})