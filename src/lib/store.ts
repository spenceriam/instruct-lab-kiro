'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { sessionStorageMiddleware, sessionStorageUtils, setupSessionCleanup } from './sessionStorage'
import { 
  AppState, 
  AppActions, 
  TestState, 
  UserSettings, 
  Model, 
  TestRun, 
  SuccessMetrics 
} from './types'

// Default user settings
const defaultSettings: UserSettings = {
  temperature: 0.7,
  maxTokens: 1000,
  evaluationModel: 'gpt-4',
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
    sessionStorageMiddleware(
      (set, get) => ({
        // Initial state
        ...defaultState,

        // Session management actions
        initializeSession: async () => {
          const sessionId = crypto.randomUUID()
          set({ sessionId })
          
          // Set up cleanup handlers
          if (typeof window !== 'undefined') {
            setupSessionCleanup()
          }
        },

        setApiKey: async (key: string) => {
          set({ isLoading: true, error: null })
          
          try {
            // Basic API key validation (format check)
            if (!key || key.length < 20 || !key.startsWith('sk-')) {
              throw new Error('Invalid API key format. OpenRouter keys should start with "sk-" and be at least 20 characters.')
            }

            // TODO: Validate with OpenRouter API when the service is implemented
            set({ 
              apiKey: key, 
              isApiKeyValid: true,
              isLoading: false 
            })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to validate API key',
              isLoading: false,
              apiKey: null,
              isApiKeyValid: false
            })
          }
        },

        clearApiKey: () => {
          set({ 
            apiKey: null, 
            isApiKeyValid: false,
            availableModels: [],
            modelsLastFetched: null
          })
        },

        resetSession: () => {
          sessionStorageUtils.clearSession()
          set({
            ...defaultState,
            sessionId: crypto.randomUUID()
          })
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
          const { currentTest, apiKey } = get()
          
          if (!apiKey || !currentTest.model || !currentTest.instructions || !currentTest.prompt) {
            set({ error: 'Missing required data for evaluation' })
            return
          }

          set({
            currentTest: {
              ...currentTest,
              status: 'testing'
            },
            isLoading: true,
            error: null
          })

          try {
            // TODO: Implement actual API calls when OpenRouter service is ready
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Mock evaluation results for now
            const mockResults: SuccessMetrics = {
              overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
              coherenceScore: Math.floor(Math.random() * 40) + 60,
              taskCompletionScore: Math.floor(Math.random() * 40) + 60,
              instructionAdherenceScore: Math.floor(Math.random() * 40) + 60,
              efficiencyScore: Math.floor(Math.random() * 40) + 60,
              explanation: 'Mock evaluation results for development purposes.'
            }

            const mockResponse = `This is a mock response generated for testing purposes. The system instructions were: "${currentTest.instructions.substring(0, 50)}..."`

            get().completeTest(mockResults, mockResponse)
          } catch (error) {
            set({
              currentTest: {
                ...currentTest,
                status: 'error',
                error: error instanceof Error ? error.message : 'Evaluation failed'
              },
              isLoading: false
            })
          }
        },

        completeTest: (results: SuccessMetrics, response: string) => {
          const { currentTest, settings } = get()
          
          set({
            currentTest: {
              ...currentTest,
              status: 'complete',
              results,
              response
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
              tokenUsage: {
                promptTokens: Math.floor(Math.random() * 500) + 100,
                completionTokens: Math.floor(Math.random() * 300) + 50,
                totalTokens: 0
              },
              executionTime: Math.floor(Math.random() * 3000) + 1000,
              cost: Math.random() * 0.01 + 0.001
            }
            testRun.tokenUsage.totalTokens = testRun.tokenUsage.promptTokens + testRun.tokenUsage.completionTokens

            get().addToHistory(testRun)
          }
        },

        resetCurrentTest: () => {
          set({
            currentTest: defaultTestState
          })
        },

        // History management actions
        addToHistory: (testRun: TestRun) => {
          const { testHistory } = get()
          set({
            testHistory: [testRun, ...testHistory]
          })
        },

        clearHistory: () => {
          set({
            testHistory: []
          })
        },

        // Settings management actions
        updateSettings: (newSettings: Partial<UserSettings>) => {
          const { settings } = get()
          set({
            settings: {
              ...settings,
              ...newSettings
            }
          })
        },

        // Models management actions
        fetchModels: async () => {
          const { modelsLastFetched } = get()
          
          // Only fetch if we haven't fetched in the last hour
          if (modelsLastFetched && Date.now() - modelsLastFetched < 60 * 60 * 1000) {
            return
          }

          set({ isLoading: true })

          try {
            // TODO: Implement actual OpenRouter API call
            // For now, use mock data
            const mockModels: Model[] = [
              {
                id: 'gpt-4',
                name: 'GPT-4',
                provider: 'OpenAI',
                contextLength: 8192,
                pricing: { prompt: 0.03, completion: 0.06 },
                description: 'Most capable GPT-4 model'
              },
              {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'OpenAI',
                contextLength: 4096,
                pricing: { prompt: 0.002, completion: 0.002 },
                description: 'Fast and efficient model for most tasks'
              },
              {
                id: 'claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'Anthropic',
                contextLength: 200000,
                pricing: { prompt: 0.015, completion: 0.075 },
                description: 'Most powerful Claude model'
              },
              {
                id: 'claude-3-haiku',
                name: 'Claude 3 Haiku',
                provider: 'Anthropic',
                contextLength: 200000,
                pricing: { prompt: 0.00025, completion: 0.00125 },
                description: 'Fastest Claude model'
              }
            ]

            set({
              availableModels: mockModels,
              modelsLastFetched: Date.now(),
              isLoading: false
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch models',
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
      }),
      {
        name: 'instruct-lab-session'
      }
    )
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

// Initialize session on store creation (client-side only)
if (typeof window !== 'undefined') {
  useAppStore.getState().initializeSession()
}