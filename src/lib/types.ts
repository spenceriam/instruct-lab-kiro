// Core data types for the application

export interface Model {
  id: string
  name: string
  provider: string
  contextLength: number
  pricing: {
    prompt: number
    completion: number
  }
  description?: string
}

export interface TestRun {
  id: string
  timestamp: number
  model: string
  modelProvider: string
  instructions: string
  prompt: string
  response: string
  metrics: SuccessMetrics
  tokenUsage: TokenStats
  executionTime: number
  cost: number
}

export interface SuccessMetrics {
  overallScore: number // 0-100
  coherenceScore: number // 0-100
  taskCompletionScore: number // 0-100
  instructionAdherenceScore: number // 0-100
  efficiencyScore: number // 0-100
  explanation: string
}

export interface TokenStats {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface TestState {
  status: 'idle' | 'setup' | 'instructions' | 'testing' | 'evaluating' | 'complete' | 'error'
  currentStep: number // 0-3 for the 4 steps
  model: Model | null
  instructions: string
  prompt: string
  response: string | null
  results: SuccessMetrics | null
  tokenUsage: TokenStats | null
  executionTime: number | null
  cost: number | null
  error: string | null
}

export interface SessionData {
  sessionId: string
  createdAt: number
  expiresAt: number
  encryptedApiKey?: string
  testHistory: TestRun[]
  currentTest: TestState
  settings: UserSettings
}

export interface UserSettings {
  temperature: number
  maxTokens: number
  evaluationModel: Model | null
  autoSave: boolean
}

// Store state interface
export interface AppState {
  // Session management
  sessionId: string | null
  apiKey: string | null
  isApiKeyValid: boolean
  
  // Current test state
  currentTest: TestState
  
  // Test history
  testHistory: TestRun[]
  
  // User settings
  settings: UserSettings
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Models cache
  availableModels: Model[]
  modelsLastFetched: number | null
}

// Store actions interface
export interface AppActions {
  // Session management
  initializeSession: () => Promise<void>
  setApiKey: (key: string) => Promise<void>
  clearApiKey: () => Promise<void>
  resetSession: () => Promise<void>
  clearAllData: () => Promise<void>
  
  // Test flow management
  startTest: () => void
  setCurrentStep: (step: number) => void
  selectModel: (model: Model) => void
  setInstructions: (instructions: string) => void
  setPrompt: (prompt: string) => void
  runEvaluation: () => Promise<void>
  completeTest: (results: SuccessMetrics, response: string, tokenUsage?: TokenStats, executionTime?: number, cost?: number) => Promise<void>
  resetCurrentTest: () => void
  
  // History management
  addToHistory: (testRun: TestRun) => Promise<void>
  clearHistory: () => Promise<void>
  
  // Settings management
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
  
  // Models management
  fetchModels: () => Promise<void>
  searchModels: (query: string) => Model[]
  
  // Error handling
  setError: (error: string | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}