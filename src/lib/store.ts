'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { setupSessionCleanup } from './sessionStorage'
import { SecurityManager } from './security'
import { SessionManager } from './sessionManager'
import { 
  AppState, 
  AppActions, 
  TestState, 
  UserSettings, 
  Model, 
  TestRun, 
  SuccessMetrics,
  SessionData
} from './types'
import { EvaluationEngine, TestParams } from '../services'
import { openRouterService } from '../services/openRouterService'
import { 
  ErrorRecoveryManager, 
  AppError, 
  ErrorClassifier,
  GlobalErrorHandler
} from './errorHandling'
import { performanceMonitor } from './performanceMonitor'

// Default user settings
const defaultSettings: UserSettings = {
  temperature: 0.7,
  maxTokens: 1000,
  evaluationModel: null,
  autoSave: true
}

// Default test state
const defaultTestState: TestState = {
  status: 'idle',
  currentStep: 0,
  model: null,
  instructions: '',
  prompt: '',
  response: null,
  results: null,
  tokenUsage: null,
  executionTime: null,
  cost: null,
  error: null
}

// Default app state
const defaultState: AppState = {
  sessionId: null,
  apiKey: null,
  isApiKeyValid: false,
  currentTest: defaultTestState,
  testHistory: [],
  settings: defaultSettings,
  isLoading: false,
  error: null,
  availableModels: [],
  modelsLastFetched: null
}

// Create the store with session persistence
export const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector(
    (set, get) => ({
        // Initial state
        ...defaultState,

        // Session management actions
        initializeSession: async () => {
          try {
            // Initialize SecurityManager and SessionManager
            if (!SecurityManager.isWebCryptoAvailable()) {
              throw new Error('Web Crypto API is not available in this browser')
            }

            SessionManager.initialize()

            // Try to load existing session
            const existingSession = await SessionManager.loadSession()
            
            if (existingSession) {
              // Load session data into store
              const apiKey = await SessionManager.getApiKey(existingSession)
              
              set({
                sessionId: existingSession.sessionId,
                apiKey,
                isApiKeyValid: !!apiKey && SecurityManager.validateApiKeyFormat(apiKey),
                testHistory: existingSession.testHistory,
                currentTest: existingSession.currentTest,
                settings: existingSession.settings
              })
            } else {
              // Create new session
              const newSession = SessionManager.createSession()
              await SessionManager.saveSession(newSession)
              
              set({ 
                sessionId: newSession.sessionId,
                currentTest: newSession.currentTest,
                settings: newSession.settings
              })
            }

            // Set up cleanup handlers
            if (typeof window !== 'undefined') {
              setupSessionCleanup()
              
              // Listen for session events
              window.addEventListener('sessionExpired', () => {
                get().resetSession()
              })
              
              window.addEventListener('sessionCleared', () => {
                get().resetSession()
              })
            }
          } catch (error) {
            console.error('Failed to initialize session:', error)
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize session',
              sessionId: SecurityManager.generateSessionId()
            })
          }
        },

        setApiKey: async (key: string) => {
          const operationId = 'set_api_key'
          set({ isLoading: true, error: null })
          
          try {
            // Preserve key for recovery
            ErrorRecoveryManager.preserveUserInput(operationId, { apiKey: key })
            
            // Validate API key format
            if (!SecurityManager.validateApiKeyFormat(key)) {
              throw new Error('Invalid API key format. Please check your OpenRouter API key.')
            }

            // Validate with OpenRouter API
            const isValid = await openRouterService.validateApiKey(key)
            if (!isValid) {
              throw new Error('Invalid API key. Please verify your OpenRouter API key.')
            }

            // Get current session
            const currentSession = await SessionManager.loadSession()
            if (!currentSession) {
              throw new Error('No active session found')
            }

            // Store encrypted API key
            await SessionManager.storeApiKey(key, currentSession)
            
            set({ 
              apiKey: key, 
              isApiKeyValid: true,
              isLoading: false 
            })
            
            // Clear recovery state on success
            ErrorRecoveryManager.clearRecoveryState(operationId)
          } catch (error) {
            const appError = ErrorClassifier.classifyError(error)
            ErrorRecoveryManager.updateRetryCount(operationId)
            
            set({ 
              error: appError.message,
              isLoading: false,
              apiKey: null,
              isApiKeyValid: false
            })
          }
        },

        clearApiKey: async () => {
          try {
            const currentSession = await SessionManager.loadSession()
            if (currentSession) {
              // Remove API key from session
              const updatedSession: SessionData = {
                ...currentSession,
                encryptedApiKey: undefined
              }
              await SessionManager.saveSession(updatedSession)
            }

            set({ 
              apiKey: null, 
              isApiKeyValid: false,
              availableModels: [],
              modelsLastFetched: null
            })
          } catch (error) {
            console.error('Failed to clear API key:', error)
            set({ 
              apiKey: null, 
              isApiKeyValid: false,
              availableModels: [],
              modelsLastFetched: null
            })
          }
        },

        resetSession: async () => {
          try {
            await SessionManager.clearSession()
            const newSession = SessionManager.createSession()
            await SessionManager.saveSession(newSession)
            
            set({
              ...defaultState,
              sessionId: newSession.sessionId,
              currentTest: newSession.currentTest,
              settings: newSession.settings
            })
          } catch (error) {
            console.error('Failed to reset session:', error)
            set({
              ...defaultState,
              sessionId: SecurityManager.generateSessionId()
            })
          }
        },

        // Test flow management actions
        startTest: () => {
          set({
            currentTest: {
              ...defaultTestState,
              status: 'setup'
            }
          })
        },

        setCurrentStep: (step: number) => {
          const { currentTest } = get()
          const stepStatuses = ['setup', 'instructions', 'testing', 'complete'] as const
          
          set({
            currentTest: {
              ...currentTest,
              currentStep: step,
              status: stepStatuses[step] as TestState['status']
            }
          })
        },

        selectModel: (model: Model) => {
          const { currentTest } = get()
          set({
            currentTest: {
              ...currentTest,
              model
            }
          })
        },

        selectEvaluationModel: (model: Model) => {
          const { settings } = get()
          set({
            settings: {
              ...settings,
              evaluationModel: model
            }
          })
        },

        setInstructions: (instructions: string) => {
          const { currentTest } = get()
          set({
            currentTest: {
              ...currentTest,
              instructions
            }
          })
        },

        setPrompt: (prompt: string) => {
          const { currentTest } = get()
          set({
            currentTest: {
              ...currentTest,
              prompt
            }
          })
        },

        runEvaluation: async () => {
          const { currentTest, apiKey, settings } = get()
          const operationId = 'run_evaluation'
          
          if (!apiKey || !currentTest.model || !settings.evaluationModel || !currentTest.instructions || !currentTest.prompt) {
            set({ error: 'Missing required data for evaluation. Please select both primary and evaluation models.' })
            return
          }

          // Preserve evaluation data for recovery
          ErrorRecoveryManager.preserveUserInput(operationId, {
            model: currentTest.model,
            instructions: currentTest.instructions,
            prompt: currentTest.prompt,
            settings,
            timestamp: Date.now()
          })

          set({
            currentTest: {
              ...currentTest,
              status: 'testing',
              error: null
            },
            isLoading: true,
            error: null
          })

          try {
            // Update status to evaluating when starting the evaluation phase
            set({
              currentTest: {
                ...currentTest,
                status: 'evaluating'
              }
            })

            // Prepare test parameters
            const testParams: TestParams = {
              apiKey,
              model: currentTest.model,
              evaluationModel: settings.evaluationModel,
              systemInstructions: currentTest.instructions,
              userPrompt: currentTest.prompt,
              temperature: settings.temperature,
              maxTokens: settings.maxTokens
            }

            // Execute the dual-model evaluation
            const result = await EvaluationEngine.executeEvaluation(testParams)

            // Complete the test with results
            get().completeTest(result.metrics, result.response, result.tokenUsage, result.executionTime, result.cost)
            
            // Clear recovery state on success
            ErrorRecoveryManager.clearRecoveryState(operationId)
          } catch (error) {
            console.error('Evaluation failed:', error)
            
            const appError = error as AppError
            ErrorRecoveryManager.updateRetryCount(operationId)
            
            set({
              currentTest: {
                ...currentTest,
                status: 'error',
                error: appError.message
              },
              isLoading: false,
              error: appError.message
            })
          }
        },

        completeTest: async (results: SuccessMetrics, response: string, tokenUsage?: import('./types').TokenStats, executionTime?: number, cost?: number) => {
          const { currentTest, settings } = get()
          
          set({
            currentTest: {
              ...currentTest,
              status: 'complete',
              currentStep: 3, // Automatically advance to results step
              results,
              response,
              tokenUsage: tokenUsage || null,
              executionTime: executionTime || null,
              cost: cost || null
            },
            isLoading: false
          })

          // Auto-save to history if enabled
          if (settings.autoSave && currentTest.model) {
            const testRun: TestRun = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              model: currentTest.model.name,
              modelProvider: currentTest.model.provider,
              instructions: currentTest.instructions,
              prompt: currentTest.prompt,
              response,
              metrics: results,
              tokenUsage: tokenUsage || {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
              },
              executionTime: executionTime || 0,
              cost: cost || 0
            }

            await get().addToHistory(testRun)
          }
        },

        resetCurrentTest: () => {
          set({
            currentTest: defaultTestState
          })
        },

        // History management actions
        addToHistory: async (testRun: TestRun) => {
          try {
            const currentSession = await SessionManager.loadSession()
            if (currentSession) {
              const updatedSession = await SessionManager.addTestToHistory(testRun, currentSession)
              set({
                testHistory: updatedSession.testHistory
              })
            } else {
              // Fallback to local state only
              const { testHistory } = get()
              set({
                testHistory: [testRun, ...testHistory]
              })
            }
          } catch (error) {
            console.error('Failed to add test to history:', error)
            // Fallback to local state only
            const { testHistory } = get()
            set({
              testHistory: [testRun, ...testHistory]
            })
          }
        },

        clearHistory: async () => {
          try {
            const currentSession = await SessionManager.loadSession()
            if (currentSession) {
              const updatedSession = await SessionManager.clearTestHistory(currentSession)
              set({
                testHistory: updatedSession.testHistory
              })
            } else {
              set({
                testHistory: []
              })
            }
          } catch (error) {
            console.error('Failed to clear history:', error)
            set({
              testHistory: []
            })
          }
        },

        // Settings management actions
        updateSettings: async (newSettings: Partial<UserSettings>) => {
          try {
            const currentSession = await SessionManager.loadSession()
            if (currentSession) {
              const updatedSession = await SessionManager.updateSettings(newSettings, currentSession)
              set({
                settings: updatedSession.settings
              })
            } else {
              // Fallback to local state only
              const { settings } = get()
              set({
                settings: {
                  ...settings,
                  ...newSettings
                }
              })
            }
          } catch (error) {
            console.error('Failed to update settings:', error)
            // Fallback to local state only
            const { settings } = get()
            set({
              settings: {
                ...settings,
                ...newSettings
              }
            })
          }
        },

        // Models management actions
        fetchModels: async () => {
          const { modelsLastFetched, apiKey } = get()
          const operationId = 'fetch_models'
          
          // Check cache first and record cache event
          if (modelsLastFetched && Date.now() - modelsLastFetched < 60 * 60 * 1000) {
            performanceMonitor.recordCacheEvent('models_fetch', true)
            return
          }

          if (!apiKey) {
            set({ error: 'API key required to fetch models' })
            return
          }

          set({ isLoading: true, error: null })

          try {
            // Preserve context for recovery
            ErrorRecoveryManager.preserveUserInput(operationId, { 
              apiKey,
              timestamp: Date.now()
            })

            // Time the API call
            const models = await performanceMonitor.timeAsync('fetch_models_api', async () => {
              return await openRouterService.fetchModels(apiKey)
            })

            performanceMonitor.recordCacheEvent('models_fetch', false)
            performanceMonitor.recordApiCall('models', Date.now() - (get().modelsLastFetched || 0), true)

            set({
              availableModels: models,
              modelsLastFetched: Date.now(),
              isLoading: false
            })
            
            // Clear recovery state on success
            ErrorRecoveryManager.clearRecoveryState(operationId)
          } catch (error) {
            const appError = ErrorClassifier.classifyError(error)
            ErrorRecoveryManager.updateRetryCount(operationId)
            
            performanceMonitor.recordApiCall('models', Date.now() - (get().modelsLastFetched || 0), false)
            
            set({
              error: appError.message,
              isLoading: false
            })
          }
        },

        searchModels: (query: string) => {
          const { availableModels } = get()
          if (!query.trim()) return availableModels

          const lowercaseQuery = query.toLowerCase()
          return availableModels.filter(model =>
            model.name.toLowerCase().includes(lowercaseQuery) ||
            model.provider.toLowerCase().includes(lowercaseQuery) ||
            model.description?.toLowerCase().includes(lowercaseQuery)
          )
        },

        // Error handling actions
        setError: (error: string | null) => {
          set({ error })
        },

        clearError: () => {
          set({ error: null })
        },

        setLoading: (isLoading: boolean) => {
          set({ isLoading })
        }
      })
  )
)

// Store selectors for common use cases
export const useSessionData = () => useAppStore((state) => ({
  sessionId: state.sessionId,
  apiKey: state.apiKey,
  isApiKeyValid: state.isApiKeyValid
}))

export const useCurrentTest = () => useAppStore((state) => state.currentTest)

export const useTestHistory = () => useAppStore((state) => state.testHistory)

export const useAppError = () => useAppStore((state) => ({
  error: state.error,
  isLoading: state.isLoading
}))

export const useAvailableModels = () => useAppStore((state) => ({
  models: state.availableModels,
  lastFetched: state.modelsLastFetched
}))

// Actions selectors
export const useSessionActions = () => useAppStore((state) => ({
  initializeSession: state.initializeSession,
  setApiKey: state.setApiKey,
  clearApiKey: state.clearApiKey,
  resetSession: state.resetSession
}))

export const useTestActions = () => useAppStore((state) => ({
  startTest: state.startTest,
  setCurrentStep: state.setCurrentStep,
  selectModel: state.selectModel,
  selectEvaluationModel: state.selectEvaluationModel,
  setInstructions: state.setInstructions,
  setPrompt: state.setPrompt,
  runEvaluation: state.runEvaluation,
  resetCurrentTest: state.resetCurrentTest
}))

export const useHistoryActions = () => useAppStore((state) => ({
  addToHistory: state.addToHistory,
  clearHistory: state.clearHistory
}))

export const useModelsActions = () => useAppStore((state) => ({
  fetchModels: state.fetchModels,
  searchModels: state.searchModels
}))

// Initialize session and error handling on store creation (client-side only)
if (typeof window !== 'undefined') {
  // Initialize global error handler
  GlobalErrorHandler.addErrorListener((error: AppError) => {
    const store = useAppStore.getState()
    store.setError(error.message)
  })
  
  // Initialize session
  useAppStore.getState().initializeSession()
}