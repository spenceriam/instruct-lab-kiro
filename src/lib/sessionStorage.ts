'use client'

import { StateCreator, StoreMutatorIdentifier } from 'zustand'
import { SessionData } from './types'

// Session storage key
const STORAGE_KEY = 'instruct-lab-session'

// Session TTL (1 hour)
const SESSION_TTL = 60 * 60 * 1000

type SessionStorageMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [...Mps, ['session-storage', unknown]], Mcs>,
  options?: {
    name?: string
    serialize?: (state: T) => string
    deserialize?: (str: string) => T
  }
) => StateCreator<T, Mps, [['session-storage', unknown], ...Mcs]>

// Encryption utilities using Web Crypto API
class SessionEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  private static async getStoredKey(): Promise<CryptoKey | null> {
    try {
      const keyData = sessionStorage.getItem('instruct-lab-key')
      if (!keyData) return null

      const keyBuffer = new Uint8Array(JSON.parse(keyData))
      return await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
      )
    } catch {
      return null
    }
  }

  private static async storeKey(key: CryptoKey): Promise<void> {
    const keyBuffer = await crypto.subtle.exportKey('raw', key)
    const keyArray = Array.from(new Uint8Array(keyBuffer))
    sessionStorage.setItem('instruct-lab-key', JSON.stringify(keyArray))
  }

  static async encryptData(data: string): Promise<string> {
    try {
      let key = await this.getStoredKey()
      if (!key) {
        key = await this.generateKey()
        await this.storeKey(key)
      }

      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const iv = crypto.getRandomValues(new Uint8Array(12))

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        dataBuffer
      )

      const encryptedArray = new Uint8Array(encrypted)
      const combinedArray = new Uint8Array(iv.length + encryptedArray.length)
      combinedArray.set(iv)
      combinedArray.set(encryptedArray, iv.length)

      return JSON.stringify(Array.from(combinedArray))
    } catch (error) {
      console.error('Encryption failed:', error)
      return data // Fallback to unencrypted
    }
  }

  static async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this.getStoredKey()
      if (!key) {
        console.warn('No encryption key found')
        return encryptedData // Assume it's unencrypted
      }

      const combinedArray = new Uint8Array(JSON.parse(encryptedData))
      const iv = combinedArray.slice(0, 12)
      const encrypted = combinedArray.slice(12)

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encrypted
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      return encryptedData // Assume it's unencrypted
    }
  }
}

// Session storage utilities
export const sessionStorageUtils = {
  async saveSession<T>(data: T, key: string = STORAGE_KEY): Promise<void> {
    try {
      const sessionData: SessionData = {
        ...(data as any),
        sessionId: (data as any).sessionId || crypto.randomUUID(),
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL
      }

      const serialized = JSON.stringify(sessionData)
      const encrypted = await SessionEncryption.encryptData(serialized)
      sessionStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  },

  async loadSession<T>(key: string = STORAGE_KEY): Promise<Partial<T> | null> {
    try {
      const encrypted = sessionStorage.getItem(key)
      if (!encrypted) return null

      const decrypted = await SessionEncryption.decryptData(encrypted)
      const sessionData: SessionData = JSON.parse(decrypted)

      // Check if session has expired
      if (Date.now() > sessionData.expiresAt) {
        sessionStorage.removeItem(key)
        sessionStorage.removeItem('instruct-lab-key')
        return null
      }

      return sessionData as any
    } catch (error) {
      console.error('Failed to load session:', error)
      return null
    }
  },

  clearSession(key: string = STORAGE_KEY): void {
    sessionStorage.removeItem(key)
    sessionStorage.removeItem('instruct-lab-key')
  },

  isSessionExpired(key: string = STORAGE_KEY): boolean {
    try {
      const encrypted = sessionStorage.getItem(key)
      if (!encrypted) return true

      // Note: We can't easily check expiration without decrypting
      // This is a simplified check
      return false
    } catch {
      return true
    }
  }
}

// Session storage middleware implementation
const sessionStorageMiddleware: SessionStorageMiddleware =
  (initializer, options) => (set, get, store) => {
    const name = options?.name || STORAGE_KEY
    const serialize = options?.serialize || JSON.stringify
    const deserialize = options?.deserialize || JSON.parse

    // Load initial state from session storage
    const loadState = async () => {
      const stored = await sessionStorageUtils.loadSession(name)
      if (stored) {
        set(stored as any, false, 'session-storage-hydrate')
      }
    }

    // Save state to session storage
    const saveState = async (state: any) => {
      await sessionStorageUtils.saveSession(state, name)
    }

    // Load state on initialization
    loadState()

    // Create enhanced set function that persists to session storage
    const persistentSet: typeof set = (partial, replace, action) => {
      const result = set(partial, replace, action)
      const state = get()
      saveState(state)
      return result
    }

    return initializer(persistentSet, get, store)
  }

export { sessionStorageMiddleware }

// Cleanup function for when the page is about to unload
export const setupSessionCleanup = () => {
  const cleanup = () => {
    // Don't automatically clear on unload - user might want to keep session
    // Only clear if session has expired on next load
  }

  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Save current state when tab becomes hidden
      const state = sessionStorage.getItem(STORAGE_KEY)
      if (state) {
        // State is already being saved automatically
      }
    }
  }

  // Set up event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', cleanup)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  return () => {}
}