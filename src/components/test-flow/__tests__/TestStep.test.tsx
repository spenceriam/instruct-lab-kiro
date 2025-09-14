/**
 * @vitest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import TestStep from '../TestStep'

// Mock the store
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn()
}))

const { useAppStore } = await import('@/lib/store')
const mockUseAppStore = useAppStore as any

describe('TestStep', () => {
  const mockSetPrompt = vi.fn()
  const mockSetCurrentStep = vi.fn()
  const mockRunEvaluation = vi.fn()

  const mockModel = {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    contextLength: 8192,
    pricing: { prompt: 0.03, completion: 0.06 }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAppStore.mockReturnValue({
      currentTest: {
        prompt: '',
        instructions: 'You are a helpful assistant.',
        model: mockModel,
        currentStep: 2
      },
      setPrompt: mockSetPrompt,
      setCurrentStep: mockSetCurrentStep,
      runEvaluation: mockRunEvaluation,
      isLoading: false
    })
  })

  it('renders test prompt input with character counter', () => {
    render(<TestStep />)
    
    expect(screen.getByText('Test Your Instructions')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Prompt *')).toBeInTheDocument()
    expect(screen.getByText('0/2000')).toBeInTheDocument()
  })

  it('shows selected model information', () => {
    render(<TestStep />)
    
    expect(screen.getByText('GPT-4')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('8,192')).toBeInTheDocument()
  })

  it('shows instructions preview', () => {
    render(<TestStep />)
    
    expect(screen.getByText('System Instructions Preview')).toBeInTheDocument()
    expect(screen.getByText('You are a helpful assistant.')).toBeInTheDocument()
  })

  it('enables run evaluation button when prompt is valid', () => {
    render(<TestStep />)
    
    const textarea = screen.getByLabelText('Test Prompt *')
    const validPrompt = 'Write a short story about a robot.'
    
    fireEvent.change(textarea, { target: { value: validPrompt } })
    
    const runButton = screen.getByText('Run Evaluation')
    expect(runButton).not.toBeDisabled()
  })

  it('calls runEvaluation when run button is clicked', () => {
    render(<TestStep />)
    
    const textarea = screen.getByLabelText('Test Prompt *')
    const validPrompt = 'Write a short story about a robot.'
    
    fireEvent.change(textarea, { target: { value: validPrompt } })
    
    const runButton = screen.getByText('Run Evaluation')
    fireEvent.click(runButton)
    
    expect(mockRunEvaluation).toHaveBeenCalled()
  })

  it('shows loading state when evaluation is running', () => {
    mockUseAppStore.mockReturnValue({
      currentTest: {
        prompt: 'Test prompt',
        instructions: 'You are a helpful assistant.',
        model: mockModel,
        currentStep: 2
      },
      setPrompt: mockSetPrompt,
      setCurrentStep: mockSetCurrentStep,
      runEvaluation: mockRunEvaluation,
      isLoading: true
    })

    render(<TestStep />)
    
    expect(screen.getByText('Running Evaluation...')).toBeInTheDocument()
    expect(screen.getByText('Running evaluation...')).toBeInTheDocument()
  })
})