'use client'

/**
 * SecurityManager - Handles API key encryption/decryption using Web Crypto API
 * Provides secure storage and validation for sensitive data
 */
export class SecurityManager {
  private static readonly ENCRYPTION_ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12
  private static readonly KEY_STORAGE_KEY = 'instruct-lab-crypto-key'

  /**
   * Generates a new encryption key for the session
   */
  private static async generateEncryptionKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ENCRYPTION_ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Retrieves the stored encryption key or generates a new one
   */
  private static async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    try {
      const storedKeyData = sessionStorage.getItem(this.KEY_STORAGE_KEY)
      
      if (storedKeyData) {
        const keyBuffer = new Uint8Array(JSON.parse(storedKeyData))
        return await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          this.ENCRYPTION_ALGORITHM,
          true,
          ['encrypt', 'decrypt']
        )
      }
    } catch (error) {
      console.warn('Failed to retrieve stored encryption key:', error)
    }

    // Generate new key if none exists or retrieval failed
    const newKey = await this.generateEncryptionKey()
    await this.storeEncryptionKey(newKey)
    return newKey
  }

  /**
   * Stores the encryption key in session storage
   */
  private static async storeEncryptionKey(key: CryptoKey): Promise<void> {
    try {
      const keyBuffer = await crypto.subtle.exportKey('raw', key)
      const keyArray = Array.from(new Uint8Array(keyBuffer))
      sessionStorage.setItem(this.KEY_STORAGE_KEY, JSON.stringify(keyArray))
    } catch (error) {
      console.error('Failed to store encryption key:', error)
      throw new Error('Failed to store encryption key')
    }
  }

  /**
   * Encrypts an API key using AES-GCM encryption
   */
  static async encryptApiKey(apiKey: string): Promise<string> {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key provided for encryption')
    }

    try {
      const key = await this.getOrCreateEncryptionKey()
      const encoder = new TextEncoder()
      const data = encoder.encode(apiKey)
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv: iv
        },
        key,
        data
      )

      // Combine IV and encrypted data
      const encryptedArray = new Uint8Array(encrypted)
      const combined = new Uint8Array(iv.length + encryptedArray.length)
      combined.set(iv, 0)
      combined.set(encryptedArray, iv.length)

      // Return as base64 string for storage
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('API key encryption failed:', error)
      throw new Error('Failed to encrypt API key')
    }
  }

  /**
   * Decrypts an encrypted API key
   */
  static async decryptApiKey(encryptedApiKey: string): Promise<string> {
    if (!encryptedApiKey || typeof encryptedApiKey !== 'string') {
      throw new Error('Invalid encrypted API key provided for decryption')
    }

    try {
      const key = await this.getOrCreateEncryptionKey()
      
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedApiKey)
          .split('')
          .map(char => char.charCodeAt(0))
      )

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH)
      const encrypted = combined.slice(this.IV_LENGTH)

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv: iv
        },
        key,
        encrypted
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('API key decryption failed:', error)
      throw new Error('Failed to decrypt API key')
    }
  }

  /**
   * Validates API key format for OpenRouter
   * OpenRouter API keys typically start with 'sk-or-' followed by base64-like characters
   */
  static validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false
    }

    // Trim whitespace
    const trimmedKey = apiKey.trim()

    // Check minimum length (OpenRouter keys are typically 50+ characters)
    if (trimmedKey.length < 20) {
      return false
    }

    // Check for OpenRouter prefix pattern
    const openRouterPattern = /^sk-or-[A-Za-z0-9+/=_-]+$/
    if (openRouterPattern.test(trimmedKey)) {
      return true
    }

    // Also accept generic API key patterns (for flexibility)
    const genericPattern = /^[A-Za-z0-9+/=_-]{20,}$/
    return genericPattern.test(trimmedKey)
  }

  /**
   * Securely clears all encryption keys and sensitive data
   */
  static clearSensitiveData(): void {
    try {
      sessionStorage.removeItem(this.KEY_STORAGE_KEY)
      
      // Clear any other sensitive data keys
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('api-key') || key.includes('crypto') || key.includes('encrypt'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
    } catch (error) {
      console.error('Failed to clear sensitive data:', error)
    }
  }

  /**
   * Generates a secure random session ID
   */
  static generateSessionId(): string {
    return crypto.randomUUID()
  }

  /**
   * Validates that Web Crypto API is available
   */
  static isWebCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined'
  }
}