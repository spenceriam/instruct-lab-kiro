/**
 * Tests for SecurityManager - API key encryption and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecurityManager } from '../security'

// Mock Web Crypto API
const mockCrypto = {
  randomUUID: vi.fn(() => 'test-uuid-12345'),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  }),
  subtle: {
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    importKey: vi.fn(),
    exportKey: vi.fn()
  }
}

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

describe('SecurityManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
      configurable: true
    })
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true
    })
    
    // Setup default crypto mock behaviors
    mockCrypto.subtle.generateKey.mockResolvedValue({} as CryptoKey)
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32))
    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey)
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(64))
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('decrypted-api-key'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateApiKeyFormat', () => {
    it('should validate OpenRouter API key format', () => {
      const validKey = 'sk-or-v1-abcd1234567890abcdef1234567890abcdef1234567890'
      expect(SecurityManager.validateApiKeyFormat(validKey)).toBe(true)
    })

    it('should validate generic API key format', () => {
      const validKey = 'abcd1234567890abcdef1234567890abcdef1234567890'
      expect(SecurityManager.validateApiKeyFormat(validKey)).toBe(true)
    })

    it('should reject empty or null keys', () => {
      expect(SecurityManager.validateApiKeyFormat('')).toBe(false)
      expect(SecurityManager.validateApiKeyFormat(null as any)).toBe(false)
      expect(SecurityManager.validateApiKeyFormat(undefined as any)).toBe(false)
    })

    it('should reject keys that are too short', () => {
      const shortKey = 'sk-or-short'
      expect(SecurityManager.validateApiKeyFormat(shortKey)).toBe(false)
    })

    it('should reject keys with invalid characters', () => {
      const invalidKey = 'sk-or-invalid@#$%^&*()key'
      expect(SecurityManager.validateApiKeyFormat(invalidKey)).toBe(false)
    })

    it('should trim whitespace before validation', () => {
      const keyWithWhitespace = '  sk-or-v1-abcd1234567890abcdef1234567890abcdef1234567890  '
      expect(SecurityManager.validateApiKeyFormat(keyWithWhitespace)).toBe(true)
    })
  })

  describe('encryptApiKey', () => {
    it('should encrypt API key successfully', async () => {
      const apiKey = 'sk-or-test-key-12345'
      
      const encrypted = await SecurityManager.encryptApiKey(apiKey)
      
      expect(typeof encrypted).toBe('string')
      expect(encrypted.length).toBeGreaterThan(0)
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled()
    })

    it('should throw error for invalid API key', async () => {
      await expect(SecurityManager.encryptApiKey('')).rejects.toThrow('Invalid API key provided for encryption')
      await expect(SecurityManager.encryptApiKey(null as any)).rejects.toThrow('Invalid API key provided for encryption')
    })

    it('should handle encryption failures', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'))
      
      await expect(SecurityManager.encryptApiKey('valid-key')).rejects.toThrow('Failed to encrypt API key')
    })

    it('should generate new key if none exists in storage', async () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      
      await SecurityManager.encryptApiKey('test-key')
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalled()
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    it('should use existing key from storage', async () => {
      const mockKeyData = JSON.stringify([1, 2, 3, 4, 5])
      mockSessionStorage.getItem.mockReturnValue(mockKeyData)
      
      await SecurityManager.encryptApiKey('test-key')
      
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled()
    })
  })

  describe('decryptApiKey', () => {
    it('should decrypt API key successfully', async () => {
      // Create a valid base64 string that represents encrypted data
      const mockEncryptedData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) // 16 bytes for IV + data
      const validBase64 = btoa(String.fromCharCode(...mockEncryptedData))
      
      const decrypted = await SecurityManager.decryptApiKey(validBase64)
      
      expect(decrypted).toBe('decrypted-api-key')
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
    })

    it('should throw error for invalid encrypted key', async () => {
      await expect(SecurityManager.decryptApiKey('')).rejects.toThrow('Invalid encrypted API key provided for decryption')
      await expect(SecurityManager.decryptApiKey(null as any)).rejects.toThrow('Invalid encrypted API key provided for decryption')
    })

    it('should handle decryption failures', async () => {
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'))
      
      await expect(SecurityManager.decryptApiKey('encrypted-key')).rejects.toThrow('Failed to decrypt API key')
    })
  })

  describe('generateSessionId', () => {
    it('should generate unique session ID', () => {
      const sessionId = SecurityManager.generateSessionId()
      
      expect(sessionId).toBe('test-uuid-12345')
      expect(mockCrypto.randomUUID).toHaveBeenCalled()
    })
  })

  describe('clearSensitiveData', () => {
    it('should clear encryption keys from storage', () => {
      SecurityManager.clearSensitiveData()
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('instruct-lab-crypto-key')
    })

    it('should clear all sensitive data keys', () => {
      mockSessionStorage.length = 3
      mockSessionStorage.key
        .mockReturnValueOnce('api-key-test')
        .mockReturnValueOnce('normal-data')
        .mockReturnValueOnce('crypto-data')
      
      SecurityManager.clearSensitiveData()
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('api-key-test')
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('crypto-data')
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('normal-data')
    })

    it('should handle storage errors gracefully', () => {
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      expect(() => SecurityManager.clearSensitiveData()).not.toThrow()
    })
  })

  describe('isWebCryptoAvailable', () => {
    it('should return true when Web Crypto API is available', () => {
      expect(SecurityManager.isWebCryptoAvailable()).toBe(true)
    })

    it('should return false when crypto is undefined', () => {
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

    it('should return false when crypto.subtle is undefined', () => {
      const cryptoWithoutSubtle = { ...mockCrypto }
      delete (cryptoWithoutSubtle as any).subtle
      
      Object.defineProperty(global, 'crypto', {
        value: cryptoWithoutSubtle,
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
  })

  describe('key storage and retrieval', () => {
    it('should handle corrupted key data in storage', async () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json')
      
      // Should generate new key when existing key is corrupted
      await SecurityManager.encryptApiKey('test-key')
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalled()
    })

    it('should handle key export failures', async () => {
      mockCrypto.subtle.exportKey.mockRejectedValue(new Error('Export failed'))
      
      await expect(SecurityManager.encryptApiKey('test-key')).rejects.toThrow('Failed to encrypt API key')
    })
  })
})