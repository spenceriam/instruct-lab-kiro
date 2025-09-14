/**
 * Tests for SessionManager - Session lifecycle and data management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SessionManager } from '../sessionManager'
import { SecurityManager } from '../security'
import { SessionData, TestRun, UserSettings } from '../types'

// Mock SecurityManager
vi.mock('../security', () => ({
  SecurityManager: {
    generateSessionId: vi.fn(() => 'test-session-id'),
    encryptApiKey: vi.fn((key: string) => Promise.resolve(`encrypted-${key}`)),
    decryptApiKey: vi.fn((encrypted: string) => Promise.resolve(encrypted.replace('encrypted-', ''))),
    validateApiKeyFormat: vi.fn(() => true),
    clearSensitiveData: vi.fn()
  }
}))

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
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

describe('SessionManager', () => {
  const mockTestRun: TestRun = {
    id: 'test-1',
    timestamp: Date.now(),
    model: 'gpt-4',
    modelProvider: 'OpenAI',
    instructions: 'Test instructions',
    prompt: 'Test prompt',
    response: 'Test response',
    metrics: {
      overallScore: 85,
      coherenceScore: 90,
      taskCompletionScore: 80,
      instructionAdherenceScore: 88,
      efficiencyScore: 82,
      explanation: 'Test explanation'
    },
    tokenUsage: {
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300
    },
    executionTime: 1500,
    cost: 0.0025
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    global.sessionStorage = mockSessionStorage as any
    global.window = mockWindow as any
    global.document = mockDocument as any
    
    // Reset SessionManager state
    SessionManager.cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    SessionManager.cleanup()
  })

  describe('createSession', () => {
    it('should create new session with default values', () => {
      const session = SessionManager.createSession()
      
      expect(session).toEqual({
        sessionId: 'test-session-id',
        createdAt: expect.any(Number),
        expiresAt: expect.any(Number),
        testHistory: [],
        currentTest: {
          status: 'idle',
          currentStep: 0,
          model: null,
          instructions: '',
          prompt: '',
          response: null,
          results: null,
          error: null
        },
        settings: {
          temperature: 0.7,
          maxTokens: 2000,
          evaluationModel: 'openai/gpt-4',
          autoSave: true
        }
      })
      
      expect(session.expiresAt - session.createdAt).toBe(60 * 60 * 1000) // 1 hour TTL
    })
  })

  describe('saveSession', () => {
    it('should save session to encrypted storage', async () => {
      const session = SessionManager.createSession()
      
      await SessionManager.saveSession(session)
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'instruct-lab-session',
        expect.any(String)
      )
    })

    it('should update expiration time on save', async () => {
      const session = SessionManager.createSession()
      const originalExpiration = session.expiresAt
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await SessionManager.saveSession(session)
      
      expect(session.expiresAt).toBeGreaterThan(originalExpiration)
    })

    it('should handle save errors', async () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const session = SessionManager.createSession()
      
      await expect(SessionManager.saveSession(session)).rejects.toThrow('Failed to save session data')
    })
  })

  describe('loadSession', () => {
    it('should load valid session from storage', async () => {
      const session = SessionManager.createSession()
      const sessionJson = JSON.stringify(session)
      const encrypted = btoa(sessionJson)
      
      mockSessionStorage.getItem.mockReturnValue(encrypted)
      
      const loaded = await SessionManager.loadSession()
      
      expect(loaded).toEqual(session)
    })

    it('should return null when no session exists', async () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      
      const loaded = await SessionManager.loadSession()
      
      expect(loaded).toBeNull()
    })

    it('should clear expired session', async () => {
      const expiredSession = {
        ...SessionManager.createSession(),
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      }
      const sessionJson = JSON.stringify(expiredSession)
      const encrypted = btoa(sessionJson)
      
      mockSessionStorage.getItem.mockReturnValue(encrypted)
      
      const loaded = await SessionManager.loadSession()
      
      expect(loaded).toBeNull()
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('instruct-lab-session')
    })

    it('should handle corrupted session data', async () => {
      mockSessionStorage.getItem.mockReturnValue('corrupted-data')
      
      const loaded = await SessionManager.loadSession()
      
      expect(loaded).toBeNull()
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('instruct-lab-session')
    })
  })

  describe('storeApiKey', () => {
    it('should store encrypted API key in session', async () => {
      const session = SessionManager.createSession()
      const apiKey = 'sk-or-test-key'
      
      const updatedSession = await SessionManager.storeApiKey(apiKey, session)
      
      expect(updatedSession.encryptedApiKey).toBe('encrypted-sk-or-test-key')
      expect(SecurityManager.encryptApiKey).toHaveBeenCalledWith(apiKey)
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    it('should validate API key format before storing', async () => {
      const session = SessionManager.createSession()
      vi.mocked(SecurityManager.validateApiKeyFormat).mockReturnValue(false)
      
      await expect(SessionManager.storeApiKey('invalid-key', session))
        .rejects.toThrow('Invalid API key format')
    })

    it('should handle encryption errors', async () => {
      const session = SessionManager.createSession()
      vi.mocked(SecurityManager.encryptApiKey).mockRejectedValue(new Error('Encryption failed'))
      
      await expect(SessionManager.storeApiKey('valid-key', session))
        .rejects.toThrow('Failed to store API key securely')
    })
  })

  describe('getApiKey', () => {
    it('should retrieve and decrypt API key', async () => {
      const session = {
        ...SessionManager.createSession(),
        encryptedApiKey: 'encrypted-test-key'
      }
      
      const apiKey = await SessionManager.getApiKey(session)
      
      expect(apiKey).toBe('test-key')
      expect(SecurityManager.decryptApiKey).toHaveBeenCalledWith('encrypted-test-key')
    })

    it('should return null when no encrypted key exists', async () => {
      const session = SessionManager.createSession()
      
      const apiKey = await SessionManager.getApiKey(session)
      
      expect(apiKey).toBeNull()
    })

    it('should handle decryption errors', async () => {
      const session = {
        ...SessionManager.createSession(),
        encryptedApiKey: 'encrypted-test-key'
      }
      vi.mocked(SecurityManager.decryptApiKey).mockRejectedValue(new Error('Decryption failed'))
      
      const apiKey = await SessionManager.getApiKey(session)
      
      expect(apiKey).toBeNull()
    })
  })

  describe('addTestToHistory', () => {
    it('should add test run to history', async () => {
      const session = SessionManager.createSession()
      
      const updatedSession = await SessionManager.addTestToHistory(mockTestRun, session)
      
      expect(updatedSession.testHistory).toHaveLength(1)
      expect(updatedSession.testHistory[0]).toEqual(mockTestRun)
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    it('should preserve existing history when adding new test', async () => {
      const session = {
        ...SessionManager.createSession(),
        testHistory: [mockTestRun]
      }
      
      const newTestRun = { ...mockTestRun, id: 'test-2' }
      const updatedSession = await SessionManager.addTestToHistory(newTestRun, session)
      
      expect(updatedSession.testHistory).toHaveLength(2)
      expect(updatedSession.testHistory[1]).toEqual(newTestRun)
    })
  })

  describe('clearTestHistory', () => {
    it('should clear all test history', async () => {
      const session = {
        ...SessionManager.createSession(),
        testHistory: [mockTestRun]
      }
      
      const updatedSession = await SessionManager.clearTestHistory(session)
      
      expect(updatedSession.testHistory).toHaveLength(0)
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      const session = SessionManager.createSession()
      const newSettings: Partial<UserSettings> = {
        temperature: 0.5,
        maxTokens: 1500
      }
      
      const updatedSession = await SessionManager.updateSettings(newSettings, session)
      
      expect(updatedSession.settings).toEqual({
        temperature: 0.5,
        maxTokens: 1500,
        evaluationModel: 'openai/gpt-4',
        autoSave: true
      })
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    it('should merge settings with existing values', async () => {
      const session = SessionManager.createSession()
      const newSettings: Partial<UserSettings> = {
        temperature: 0.9
      }
      
      const updatedSession = await SessionManager.updateSettings(newSettings, session)
      
      expect(updatedSession.settings.temperature).toBe(0.9)
      expect(updatedSession.settings.maxTokens).toBe(2000) // Should preserve existing value
    })
  })

  describe('clearSession', () => {
    it('should clear session and sensitive data', async () => {
      await SessionManager.clearSession()
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('instruct-lab-session')
      expect(SecurityManager.clearSensitiveData).toHaveBeenCalled()
    })

    it('should handle clear errors gracefully', async () => {
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Clear failed')
      })
      
      await expect(SessionManager.clearSession()).resolves.not.toThrow()
    })
  })

  describe('session expiration', () => {
    it('should detect expired sessions', () => {
      const expiredSession = {
        ...SessionManager.createSession(),
        expiresAt: Date.now() - 1000
      }
      
      expect(SessionManager.isSessionExpired(expiredSession)).toBe(true)
    })

    it('should detect valid sessions', () => {
      const validSession = SessionManager.createSession()
      
      expect(SessionManager.isSessionExpired(validSession)).toBe(false)
    })

    it('should extend session expiration', async () => {
      const session = SessionManager.createSession()
      const originalExpiration = session.expiresAt
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const extendedSession = await SessionManager.extendSession(session)
      
      expect(extendedSession.expiresAt).toBeGreaterThan(originalExpiration)
    })

    it('should calculate time until expiration', () => {
      const session = {
        ...SessionManager.createSession(),
        expiresAt: Date.now() + 30000 // 30 seconds from now
      }
      
      const timeRemaining = SessionManager.getTimeUntilExpiration(session)
      
      expect(timeRemaining).toBeGreaterThan(25000)
      expect(timeRemaining).toBeLessThanOrEqual(30000)
    })

    it('should return 0 for expired sessions', () => {
      const expiredSession = {
        ...SessionManager.createSession(),
        expiresAt: Date.now() - 1000
      }
      
      const timeRemaining = SessionManager.getTimeUntilExpiration(expiredSession)
      
      expect(timeRemaining).toBe(0)
    })
  })

  describe('initialization and cleanup', () => {
    it('should initialize event listeners', () => {
      SessionManager.initialize()
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })

    it('should not initialize multiple times', () => {
      SessionManager.initialize()
      SessionManager.initialize()
      
      // Should only be called once per event type
      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(2) // beforeunload and storage
      expect(mockDocument.addEventListener).toHaveBeenCalledTimes(1) // visibilitychange
    })

    it('should cleanup properly', () => {
      SessionManager.initialize()
      SessionManager.cleanup()
      
      // Verify cleanup function exists and can be called
      expect(() => SessionManager.cleanup()).not.toThrow()
    })
  })
})