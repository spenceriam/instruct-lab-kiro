'use client'

import { SecurityManager } from './security'
import { SessionData, TestRun, UserSettings, TestState } from './types'

/**
 * SessionManager - Handles session lifecycle, expiration, and cleanup
 * Manages secure storage of session data with automatic cleanup
 */
export class SessionManager {
  private static readonly SESSION_STORAGE_KEY = 'instruct-lab-session'
  private static readonly SESSION_TTL = 60 * 60 * 1000 // 1 hour in milliseconds
  private static readonly CLEANUP_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
  
  private static cleanupInterval: NodeJS.Timeout | null = null
  private static isInitialized = false

  /**
   * Initializes the session manager and sets up cleanup routines
   */
  static initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    this.isInitialized = true
    this.setupEventListeners()
    this.startCleanupTimer()
    this.checkSessionExpiration()
  }

  /**
   * Creates a new session with default values
   */
  static createSession(): SessionData {
    const now = Date.now()
    
    return {
      sessionId: SecurityManager.generateSessionId(),
      createdAt: now,
      expiresAt: now + this.SESSION_TTL,
      testHistory: [],
      currentTest: this.getDefaultTestState(),
      settings: this.getDefaultSettings()
    }
  }

  /**
   * Saves session data to encrypted storage
   */
  static async saveSession(sessionData: SessionData): Promise<void> {
    try {
      // Update expiration time on save
      sessionData.expiresAt = Date.now() + this.SESSION_TTL
      
      const serialized = JSON.stringify(sessionData)
      const encrypted = await this.encryptSessionData(serialized)
      
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, encrypted)
    } catch (error) {
      console.error('Failed to save session:', error)
      throw new Error('Failed to save session data')
    }
  }

  /**
   * Loads session data from encrypted storage
   */
  static async loadSession(): Promise<SessionData | null> {
    try {
      const encrypted = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
      if (!encrypted) {
        return null
      }

      const decrypted = await this.decryptSessionData(encrypted)
      const sessionData: SessionData = JSON.parse(decrypted)

      // Check if session has expired
      if (this.isSessionExpired(sessionData)) {
        await this.clearSession()
        return null
      }

      return sessionData
    } catch (error) {
      console.error('Failed to load session:', error)
      // Clear corrupted session data
      await this.clearSession()
      return null
    }
  }

  /**
   * Stores an encrypted API key in the session
   */
  static async storeApiKey(apiKey: string, sessionData: SessionData): Promise<SessionData> {
    if (!SecurityManager.validateApiKeyFormat(apiKey)) {
      throw new Error('Invalid API key format')
    }

    try {
      const encryptedApiKey = await SecurityManager.encryptApiKey(apiKey)
      
      const updatedSession: SessionData = {
        ...sessionData,
        encryptedApiKey
      }

      await this.saveSession(updatedSession)
      return updatedSession
    } catch (error) {
      console.error('Failed to store API key:', error)
      throw new Error('Failed to store API key securely')
    }
  }

  /**
   * Retrieves and decrypts the stored API key
   */
  static async getApiKey(sessionData: SessionData): Promise<string | null> {
    if (!sessionData.encryptedApiKey) {
      return null
    }

    try {
      return await SecurityManager.decryptApiKey(sessionData.encryptedApiKey)
    } catch (error) {
      console.error('Failed to retrieve API key:', error)
      return null
    }
  }

  /**
   * Adds a test run to the session history
   */
  static async addTestToHistory(testRun: TestRun, sessionData: SessionData): Promise<SessionData> {
    const updatedSession: SessionData = {
      ...sessionData,
      testHistory: [...sessionData.testHistory, testRun]
    }

    await this.saveSession(updatedSession)
    return updatedSession
  }

  /**
   * Clears all test history from the session
   */
  static async clearTestHistory(sessionData: SessionData): Promise<SessionData> {
    const updatedSession: SessionData = {
      ...sessionData,
      testHistory: []
    }

    await this.saveSession(updatedSession)
    return updatedSession
  }

  /**
   * Updates user settings in the session
   */
  static async updateSettings(settings: Partial<UserSettings>, sessionData: SessionData): Promise<SessionData> {
    const updatedSession: SessionData = {
      ...sessionData,
      settings: {
        ...sessionData.settings,
        ...settings
      }
    }

    await this.saveSession(updatedSession)
    return updatedSession
  }

  /**
   * Clears the entire session and all associated data
   */
  static async clearSession(): Promise<void> {
    try {
      sessionStorage.removeItem(this.SESSION_STORAGE_KEY)
      SecurityManager.clearSensitiveData()
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  /**
   * Checks if a session has expired
   */
  static isSessionExpired(sessionData: SessionData): boolean {
    return Date.now() > sessionData.expiresAt
  }

  /**
   * Extends the session expiration time
   */
  static async extendSession(sessionData: SessionData): Promise<SessionData> {
    const updatedSession: SessionData = {
      ...sessionData,
      expiresAt: Date.now() + this.SESSION_TTL
    }

    await this.saveSession(updatedSession)
    return updatedSession
  }

  /**
   * Gets the remaining time until session expiration
   */
  static getTimeUntilExpiration(sessionData: SessionData): number {
    return Math.max(0, sessionData.expiresAt - Date.now())
  }

  /**
   * Encrypts session data for storage
   */
  private static async encryptSessionData(data: string): Promise<string> {
    // For session data, we use a simpler encryption approach
    // The API key within the session is already encrypted separately
    try {
      return btoa(data) // Simple base64 encoding for session metadata
    } catch (error) {
      console.error('Failed to encrypt session data:', error)
      return data // Fallback to unencrypted
    }
  }

  /**
   * Decrypts session data from storage
   */
  private static async decryptSessionData(encryptedData: string): Promise<string> {
    try {
      return atob(encryptedData) // Simple base64 decoding
    } catch (error) {
      console.error('Failed to decrypt session data:', error)
      return encryptedData // Assume unencrypted
    }
  }

  /**
   * Sets up event listeners for session cleanup
   */
  private static setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Handle page unload
    const handleBeforeUnload = () => {
      // Don't automatically clear session on unload
      // Let it expire naturally or be cleared by user action
    }

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check for expiration when page becomes visible
        this.checkSessionExpiration()
      }
    }

    // Handle storage events (for cross-tab synchronization)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === this.SESSION_STORAGE_KEY && event.newValue === null) {
        // Session was cleared in another tab
        window.dispatchEvent(new CustomEvent('sessionCleared'))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    // Store cleanup function for later use
    ;(window as unknown as { __sessionCleanup: () => void }).__sessionCleanup = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  /**
   * Starts the automatic cleanup timer
   */
  private static startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      this.checkSessionExpiration()
    }, this.CLEANUP_CHECK_INTERVAL)
  }

  /**
   * Checks if the current session has expired and clears it if necessary
   */
  private static async checkSessionExpiration(): Promise<void> {
    try {
      const session = await this.loadSession()
      if (session && this.isSessionExpired(session)) {
        await this.clearSession()
        window.dispatchEvent(new CustomEvent('sessionExpired'))
      }
    } catch (error) {
      console.error('Error checking session expiration:', error)
    }
  }

  /**
   * Gets default test state
   */
  private static getDefaultTestState(): TestState {
    return {
      status: 'idle',
      currentStep: 0,
      model: null,
      instructions: '',
      prompt: '',
      response: null,
      results: null,
      error: null
    }
  }

  /**
   * Gets default user settings
   */
  private static getDefaultSettings(): UserSettings {
    return {
      temperature: 0.7,
      maxTokens: 2000,
      evaluationModel: 'openai/gpt-4',
      autoSave: true
    }
  }

  /**
   * Cleanup method to be called when the application is destroyed
   */
  static cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    if (typeof window !== 'undefined' && (window as unknown as { __sessionCleanup?: () => void }).__sessionCleanup) {
      (window as unknown as { __sessionCleanup: () => void }).__sessionCleanup()
    }

    this.isInitialized = false
  }
}