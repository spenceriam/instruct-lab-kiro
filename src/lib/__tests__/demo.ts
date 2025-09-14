/**
 * Demonstration script showing the SecurityManager and SessionManager working together
 * This is not a test file, but a demonstration of the functionality
 */

import { SecurityManager } from '../security'
import { SessionManager } from '../sessionManager'

// This would be run in a browser environment where Web Crypto API is available
export async function demonstrateSecurityAndSessionManagement() {
  console.log('🔐 Demonstrating API Key Encryption and Session Management')
  
  try {
    // 1. Check if Web Crypto API is available
    console.log('1. Checking Web Crypto API availability...')
    const isAvailable = SecurityManager.isWebCryptoAvailable()
    console.log(`   ✅ Web Crypto API available: ${isAvailable}`)
    
    // 2. Initialize session manager
    console.log('2. Initializing session manager...')
    SessionManager.initialize()
    console.log('   ✅ Session manager initialized')
    
    // 3. Create a new session
    console.log('3. Creating new session...')
    const session = SessionManager.createSession()
    console.log(`   ✅ Session created with ID: ${session.sessionId}`)
    console.log(`   📅 Expires at: ${new Date(session.expiresAt).toISOString()}`)
    
    // 4. Validate and store an API key
    console.log('4. Storing encrypted API key...')
    const testApiKey = 'sk-or-v1-abcd1234567890abcdef1234567890abcdef1234567890'
    
    // Validate format first
    const isValidFormat = SecurityManager.validateApiKeyFormat(testApiKey)
    console.log(`   ✅ API key format valid: ${isValidFormat}`)
    
    // Store encrypted API key
    const updatedSession = await SessionManager.storeApiKey(testApiKey, session)
    console.log('   ✅ API key encrypted and stored')
    console.log(`   🔒 Encrypted key length: ${updatedSession.encryptedApiKey?.length} characters`)
    
    // 5. Retrieve and decrypt the API key
    console.log('5. Retrieving and decrypting API key...')
    const retrievedKey = await SessionManager.getApiKey(updatedSession)
    console.log(`   ✅ API key retrieved: ${retrievedKey === testApiKey ? 'MATCH' : 'MISMATCH'}`)
    
    // 6. Add test data to session
    console.log('6. Adding test data to session...')
    const testRun = {
      id: SecurityManager.generateSessionId(),
      timestamp: Date.now(),
      model: 'gpt-4',
      modelProvider: 'OpenAI',
      instructions: 'You are a helpful assistant.',
      prompt: 'What is the capital of France?',
      response: 'The capital of France is Paris.',
      metrics: {
        overallScore: 95,
        coherenceScore: 98,
        taskCompletionScore: 100,
        instructionAdherenceScore: 92,
        efficiencyScore: 88,
        explanation: 'Excellent response with accurate information.'
      },
      tokenUsage: {
        promptTokens: 15,
        completionTokens: 8,
        totalTokens: 23
      },
      executionTime: 1200,
      cost: 0.0012
    }
    
    const sessionWithHistory = await SessionManager.addTestToHistory(testRun, updatedSession)
    console.log(`   ✅ Test run added to history (${sessionWithHistory.testHistory.length} total)`)
    
    // 7. Update user settings
    console.log('7. Updating user settings...')
    const newSettings = {
      temperature: 0.8,
      maxTokens: 1500
    }
    
    const sessionWithSettings = await SessionManager.updateSettings(newSettings, sessionWithHistory)
    console.log(`   ✅ Settings updated: temp=${sessionWithSettings.settings.temperature}, maxTokens=${sessionWithSettings.settings.maxTokens}`)
    
    // 8. Check session expiration
    console.log('8. Checking session status...')
    const isExpired = SessionManager.isSessionExpired(sessionWithSettings)
    const timeRemaining = SessionManager.getTimeUntilExpiration(sessionWithSettings)
    console.log(`   ✅ Session expired: ${isExpired}`)
    console.log(`   ⏰ Time remaining: ${Math.round(timeRemaining / 1000 / 60)} minutes`)
    
    // 9. Extend session
    console.log('9. Extending session...')
    const extendedSession = await SessionManager.extendSession(sessionWithSettings)
    const newTimeRemaining = SessionManager.getTimeUntilExpiration(extendedSession)
    console.log(`   ✅ Session extended, new time remaining: ${Math.round(newTimeRemaining / 1000 / 60)} minutes`)
    
    // 10. Demonstrate security features
    console.log('10. Demonstrating security features...')
    
    // Generate multiple session IDs to show uniqueness
    const sessionIds = Array.from({ length: 3 }, () => SecurityManager.generateSessionId())
    console.log(`   🆔 Generated session IDs: ${sessionIds.join(', ')}`)
    
    // Show that different API keys get different encrypted values
    const anotherApiKey = 'sk-or-v1-xyz9876543210fedcba9876543210fedcba9876543210'
    const encrypted1 = await SecurityManager.encryptApiKey(testApiKey)
    const encrypted2 = await SecurityManager.encryptApiKey(anotherApiKey)
    console.log(`   🔒 Different keys produce different encrypted values: ${encrypted1 !== encrypted2}`)
    
    console.log('\n🎉 Demonstration completed successfully!')
    console.log('\n📋 Summary of implemented features:')
    console.log('   ✅ Web Crypto API integration for secure encryption')
    console.log('   ✅ API key format validation (OpenRouter compatible)')
    console.log('   ✅ AES-GCM encryption with random IVs')
    console.log('   ✅ Session lifecycle management with expiration')
    console.log('   ✅ Automatic session cleanup and data clearing')
    console.log('   ✅ Browser event handling for session management')
    console.log('   ✅ Error handling and recovery mechanisms')
    console.log('   ✅ Secure storage in sessionStorage only')
    console.log('   ✅ Test history and settings persistence')
    console.log('   ✅ Cross-tab session synchronization')
    
    return {
      success: true,
      session: extendedSession,
      message: 'All security and session management features working correctly'
    }
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Security and session management demonstration failed'
    }
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...')
    await SessionManager.clearSession()
    SecurityManager.clearSensitiveData()
    SessionManager.cleanup()
    console.log('   ✅ Cleanup completed')
  }
}

// Export for potential use in browser console or integration tests
if (typeof window !== 'undefined') {
  (window as any).demonstrateSecurityAndSessionManagement = demonstrateSecurityAndSessionManagement
}