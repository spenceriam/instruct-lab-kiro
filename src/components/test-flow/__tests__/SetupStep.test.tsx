/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import SetupStep from '../SetupStep'
import { useAppStore } from '@/lib/store'

// Mock the store
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn()
}))

const mockUseAppStore = useAppStore as vi.MockedFunction<typeof useAppStore>

describe('SetupStep', () => {
  const mockSetCurrentStep = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock store state
    mockUseAppStore.mockReturnValue({
      currentTest: {
        status: 'setup',
        currentStep: 0,
        model: null,
        instructions: '',
        prompt: '',
        response: null,
        results: null,
        error: null
      },
      isApiKeyValid: false,
      setCurrentStep: mockSetCurrentStep,
      // Add other required properties with default values
      sessionId: null,
      apiKey: null,
      testHistory: [],
      settings: {
        temperature: 0.7,
        maxTokens: 2000,
        evaluationModel: 'openai/gpt-4',
        autoSave: true
      },
      isLoading: false,
      error: null,
      availableModels: [],
      modelsLastFetched: null,
      // Add required action methods as mocks
      initializeSession: vi.fn(),
      setApiKey: vi.fn(),
      clearApiKey: vi.fn(),
      resetSession: vi.fn(),
      startTest: vi.fn(),
      selectModel: vi.fn(),
      setInstructions: vi.fn(),
      setPrompt: vi.fn(),
      runEvaluation: vi.fn(),
      completeTest: vi.fn(),
      resetCurrentTest: vi.fn(),
      addToHistory: vi.fn(),
      clearHistory: vi.fn(),
      updateSettings: vi.fn(),
      fetchModels: vi.fn(),
      searchModels: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn()
    })
  })

  it('renders API key input section', () => {
    render(<SetupStep />)
    
    expect(screen.getByText('OpenRouter API Key')).toBeInTheDocument()
    expect(screen.getByText(/Enter your OpenRouter API key/)).toBeInTheDocument()
  })

  it('shows model selection when API key is valid', () => {
    mockUseAppStore.mockReturnValue({
      ...mockUseAppStore(),
      isApiKeyValid: true
    })
    
    render(<SetupStep />)
    
    expect(screen.getByText('Select Model')).toBeInTheDocument()
    expect(screen.getByText(/Choose the AI model/)).toBeInTheDocument()
  })

  it('disables next button when requirements not met', () => {
    render(<SetupStep />)
    
    const nextButton = screen.getByRole('button', { name: /Next: Instructions/ })
    expect(nextButton).toBeDisabled()
  })

  it('enables next button when API key is valid and model is selected', () => {
    const mockModel = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      contextLength: 8192,
      pricing: { prompt: 0.03, completion: 0.06 },
      description: 'Most capable GPT-4 model'
    }

    mockUseAppStore.mockReturnValue({
      ...mockUseAppStore(),
      isApiKeyValid: true,
      currentTest: {
        ...mockUseAppStore().currentTest,
        model: mockModel
      }
    })
    
    render(<SetupStep />)
    
    const nextButton = screen.getByRole('button', { name: /Next: Instructions/ })
    expect(nextButton).not.toBeDisabled()
  })

  it('calls setCurrentStep when next button is clicked', () => {
    const mockModel = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      contextLength: 8192,
      pricing: { prompt: 0.03, completion: 0.06 },
      description: 'Most capable GPT-4 model'
    }

    mockUseAppStore.mockReturnValue({
      ...mockUseAppStore(),
      isApiKeyValid: true,
      currentTest: {
        ...mockUseAppStore().currentTest,
        model: mockModel
      }
    })
    
    render(<SetupStep />)
    
    const nextButton = screen.getByRole('button', { name: /Next: Instructions/ })
    fireEvent.click(nextButton)
    
    expect(mockSetCurrentStep).toHaveBeenCalledWith(1)
  })
})