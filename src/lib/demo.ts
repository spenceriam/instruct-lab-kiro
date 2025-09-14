/**
 * Demo file showing how to use SecurityManager and SessionManager
 * This file demonstrates the key functionality implemented in task 6
 */

import { SecurityManager } from './security'
import { SessionManager } from './sessionManager'

export async function demonstrateSecurityFeatures() {
  console.log('=== SecurityManager and SessionManager Demo ===')

  // 1. Check if Web Crypto API is available
  console.log('Web Crypto API available:', SecurityManager.isWebCryptoAvailable())

  // 2. Validate API key formats
  console.log('Valid OpenRouter key:', SecurityManager.validateApiKeyFormat('sk-or-1234567890abcdef'))
  console.log('Invalid key:', SecurityManager.validateApiKeyFormat('invalid-key'))

  // 3. Generate session ID
  const sessionId = SecurityManager.generateSessionId()
  console.log('Generated session ID:', sessionId)

  // 4. Create a new session
  const session = SessionManager.createSession()
  console.log('New session created:', {
    sessionId: session.sessionId,
    expiresAt: new Date(session.expiresAt).toISOString(),
    historyCount: session.testHistory.length
  })

  // 5. Store and retrieve API key (if Web Crypto is available)
  if (SecurityManager.isWebCryptoAvailable()) {
    try {
      const testApiKey = 'sk-or-test-api-key-1234567890abcdef'
      
      // Store encrypted API key
      const updatedSession = await SessionManager.storeApiKey(testApiKey, session)
      console.log('API key stored successfully')
      
      // Retrieve decrypted API key
      const retrievedKey = await SessionManager.getApiKey(updatedSession)
      console.log('API key retrieved:', retrievedKey === testApiKey ? 'SUCCESS' : 'FAILED')
      
      // Save session to storage
      await SessionManager.saveSession(updatedSession)
      console.log('Session saved to storage')
      
      // Load session from storage
      const loadedSession = await SessionManager.loadSession()
      console.log('Session loaded from storage:', loadedSession ? 'SUCCESS' : 'FAILED')
      
    } catch (error) {
      console.error('Demo error:', error)
    }
  }

  // 6. Check session expiration
  console.log('Session expired:', SessionManager.isSessionExpired(session))
  console.log('Time until expiration:', Math.round(SessionManager.getTimeUntilExpiration(session) / 1000), 'seconds')

  console.log('=== Demo Complete ===')
}

// Export for use in components or other parts of the application
export { SecurityManager, SessionManager }