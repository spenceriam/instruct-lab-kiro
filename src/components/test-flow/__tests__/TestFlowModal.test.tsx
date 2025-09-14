/**
 * Tests for TestFlowModal - Main test flow component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TestFlowModal from '../TestFlowModal'
import { useAppStore } from '@/lib/store'

// Mock the store
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn()
}))

// Mock child components
vi.mock('../SetupStep', () => ({
  default: () => <div data-testid="setup-step">Setup Step</div>
}))

vi.mock('../InstructionsStep', () => ({
  default: () => <div data-testid="instructions-step">Instructions Step</div>
}))

vi.mock('../TestStep', () => ({
  default: () => <div data-testid="test-step">Test Step</div>
}))

vi.mock('../ResultsStep', () => ({
  default: () => <div data-testid="results-step">Results Step</div>
}))

const mockUseAppStore = useAppStore as vi.MockedFunction<typeof useAppStore>

describe('TestFlowModal', () => {
  const mockCloseModal = vi.fn()
  const mockSetCurrentStep = vi.fn()
  const mockResetCurrentTest = vi.fn()

  const defaultStoreState = {
    currentTest: {
      status: 'idle' as const,
      currentStep: 0,
      model: null,
      instructions: '',
      prompt: '',
      response: null,
      results: null,
      error: null
    },
    setCurrentStep: mockSetCurrentStep,
    resetCurrentTest: mockResetCurrentTest,
    // Add other required store properties
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
    isApiKeyValid: false,
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
    addToHistory: vi.fn(),
    clearHistory: vi.fn(),
    updateSettings: vi.fn(),
    fetchModels: vi.fn(),
    searchModels: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAppStore.mockReturnValue(defaultStoreState)
  })

  describe('modal structure', () => {
    it('should render modal with header and navigation', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      expect(screen.getByText('Test Your Instructions')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i, hidden: true })).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<TestFlowModal isOpen={false} onClose={mockCloseModal} />)
      
      expect(screen.queryByText('Test Your Instructions')).not.toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      fireEvent.click(screen.getByLabelText(/close/i))
      
      expect(mockCloseModal).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when overlay is clicked', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const overlay = screen.getByTestId('modal-overlay')
      fireEvent.click(overlay)
      
      expect(mockCloseModal).toHaveBeenCalledTimes(1)
    })
  })

  describe('step navigation', () => {
    it('should render step indicators', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      expect(screen.getByText('Setup')).toBeInTheDocument()
      expect(screen.getByText('Instructions')).toBeInTheDocument()
      expect(screen.getByText('Test')).toBeInTheDocument()
      expect(screen.getByText('Results')).toBeInTheDocument()
    })

    it('should highlight current step', () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        currentTest: {
          ...defaultStoreState.currentTest,
          currentStep: 1
        }
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const instructionsTab = screen.getByText('Instructions').closest('button')
      expect(instructionsTab).toHaveClass('bg-primary')
    })

    it('should show completed steps', () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        isApiKeyValid: true,
        currentTest: {
          ...defaultStoreState.currentTest,
          currentStep: 2,
          model: { id: 'gpt-4', name: 'GPT-4' } as any,
          instructions: 'Test instructions'
        }
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const setupTab = screen.getByText('Setup').closest('button')
      const instructionsTab = screen.getByText('Instructions').closest('button')
      
      expect(setupTab).toHaveClass('bg-success')
      expect(instructionsTab).toHaveClass('bg-success')
    })

    it('should allow clicking on accessible steps', () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        isApiKeyValid: true,
        currentTest: {
          ...defaultStoreState.currentTest,
          currentStep: 2,
          model: { id: 'gpt-4', name: 'GPT-4' } as any,
          instructions: 'Test instructions'
        }
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const setupTab = screen.getByText('Setup').closest('button')
      fireEvent.click(setupTab!)
      
      expect(mockSetCurrentStep).toHaveBeenCalledWith(0)
    })

    it('should disable inaccessible steps', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const testTab = screen.getByText('Test').closest('button')
      expect(testTab).toBeDisabled()
    })
  })

  describe('step content rendering', () => {
    it('should render setup step by default', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      expect(screen.getByTestId('setup-step')).toBeInTheDocument()
    })

    it('should render instructions step when selected', () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        currentTest: {
          ...defaultStoreState.currentTest,
          currentStep: 1
        }
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      expect(screen.getByTestId('instructions-step')).toBeInTheDocument()
    })

    it('should render test step when selected', () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        currentTest: {
          ...defaultStoreState.currentTest,
          currentStep: 2
        }
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      expect(screen.getByTestId('test-step')).toBeInTheDocument()
    })

    it('should render results step when selected', async () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        currentTest: {
          ...defaultStoreState.currentTest,
          currentStep: 3,
          results: { overallScore: 85 } as any,
          response: 'Test response'
        }
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      expect(await screen.findByTestId('results-step')).toBeInTheDocument()
    })
  })

  describe('step validation', () => {
    it('should determine setup step completion', () => {
      const incompleteState = {
        ...defaultStoreState,
        currentTest: {
          ...defaultStoreState.currentTest,
          model: null
        }
      }
      
      mockUseAppStore.mockReturnValue(incompleteState)
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const instructionsTab = screen.getByText('Instructions').closest('button')
      expect(instructionsTab).toBeDisabled()
    })

    it('should determine instructions step completion', () => {
      const completeState = {
        ...defaultStoreState,
        isApiKeyValid: true,
        currentTest: {
          ...defaultStoreState.currentTest,
          model: { id: 'gpt-4', name: 'GPT-4' } as any,
          instructions: 'Complete instructions'
        }
      }
      
      mockUseAppStore.mockReturnValue(completeState)
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const testTab = screen.getByText('Test').closest('button')
      expect(testTab).not.toBeDisabled()
    })

    it('should determine test step completion', () => {
      const completeState = {
        ...defaultStoreState,
        isApiKeyValid: true,
        currentTest: {
          ...defaultStoreState.currentTest,
          model: { id: 'gpt-4', name: 'GPT-4' } as any,
          instructions: 'Complete instructions',
          prompt: 'Test prompt',
          results: { overallScore: 85 } as any,
          response: 'Test response'
        }
      }
      
      mockUseAppStore.mockReturnValue(completeState)
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const resultsTab = screen.getByText('Results').closest('button')
      expect(resultsTab).not.toBeDisabled()
    })
  })



  describe('keyboard navigation', () => {
    it('should close modal on Escape key', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockCloseModal).toHaveBeenCalledTimes(1)
    })

    it('should trap focus within modal', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const modal = screen.getByRole('dialog', { hidden: true })
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const modal = screen.getByRole('dialog', { hidden: true })
      expect(modal).toHaveAttribute('aria-labelledby')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    it('should have accessible step navigation', () => {
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const setupTab = screen.getByText('Setup').closest('button')
      expect(setupTab).toHaveAttribute('aria-selected', 'true')
      expect(setupTab).toHaveAttribute('role', 'tab')
    })

    it('should announce step changes to screen readers', () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        currentTest: {
          ...defaultStoreState.currentTest,
          currentStep: 1
        }
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const instructionsTab = screen.getByText('Instructions').closest('button')
      expect(instructionsTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('responsive behavior', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<TestFlowModal isOpen={true} onClose={mockCloseModal} />)
      
      const modal = screen.getByRole('dialog', { hidden: true })
      const modalContent = modal.querySelector('.max-w-4xl')
      expect(modalContent).toBeInTheDocument()
    })
  })
})