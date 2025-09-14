import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ResultsStep from '../ResultsStep'
import { useAppStore } from '@/lib/store'

// Mock the store
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn()
}))

const mockUseAppStore = vi.mocked(useAppStore)

describe('ResultsStep', () => {
  const mockSetCurrentStep = vi.fn()
  const mockResetCurrentTest = vi.fn()

  const mockResults = {
    overallScore: 85,
    coherenceScore: 90,
    taskCompletionScore: 85,
    instructionAdherenceScore: 80,
    efficiencyScore: 85,
    explanation: 'The response demonstrates good coherence and task completion.'
  }

  const mockModel = {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    contextLength: 8192,
    pricing: { prompt: 0.03, completion: 0.06 }
  }

  const mockTokenUsage = {
    promptTokens: 150,
    completionTokens: 300,
    totalTokens: 450
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders results with animated metrics', () => {
    mockUseAppStore.mockReturnValue({
      currentTest: {
        results: mockResults,
        response: 'This is a test response from the AI model.',
        model: mockModel,
        tokenUsage: mockTokenUsage,
        executionTime: 2300, // 2.3 seconds in ms
        cost: 0.0045
      },
      setCurrentStep: mockSetCurrentStep,
      resetCurrentTest: mockResetCurrentTest
    })

    render(<ResultsStep />)

    // Check for success indicator
    expect(screen.getByText('Evaluation Complete')).toBeInTheDocument()

    // Check for overall score (should start at 0 and animate to 85)
    expect(screen.getByText(/Overall/)).toBeInTheDocument()

    // Check for individual metrics
    expect(screen.getByText('Coherence')).toBeInTheDocument()
    expect(screen.getByText('Task Completion')).toBeInTheDocument()
    expect(screen.getByText('Instruction Adherence')).toBeInTheDocument()
    expect(screen.getByText('Efficiency')).toBeInTheDocument()

    // Check for statistics
    expect(screen.getByText('Total Tokens')).toBeInTheDocument()
    expect(screen.getByText('Execution Time')).toBeInTheDocument()
    expect(screen.getByText('Cost')).toBeInTheDocument()
    expect(screen.getByText('Model')).toBeInTheDocument()

    // Check for evaluation explanation
    expect(screen.getByText('Evaluation Summary')).toBeInTheDocument()
    expect(screen.getByText(mockResults.explanation)).toBeInTheDocument()

    // Check for model response
    expect(screen.getByText('Model Response')).toBeInTheDocument()
    expect(screen.getByText('This is a test response from the AI model.')).toBeInTheDocument()

    // Check for action buttons
    expect(screen.getByText('Run Again')).toBeInTheDocument()
    expect(screen.getByText('New Test')).toBeInTheDocument()
  })

  it('handles missing results gracefully', () => {
    mockUseAppStore.mockReturnValue({
      currentTest: {
        results: null,
        response: null,
        model: null,
        tokenUsage: null,
        executionTime: null,
        cost: null
      },
      setCurrentStep: mockSetCurrentStep,
      resetCurrentTest: mockResetCurrentTest
    })

    render(<ResultsStep />)

    expect(screen.getByText('No results available. Please run an evaluation first.')).toBeInTheDocument()
    expect(screen.getByText('Back to Test')).toBeInTheDocument()
  })

  it('handles missing token usage and cost data', () => {
    mockUseAppStore.mockReturnValue({
      currentTest: {
        results: mockResults,
        response: 'Test response',
        model: mockModel,
        tokenUsage: null,
        executionTime: null,
        cost: null
      },
      setCurrentStep: mockSetCurrentStep,
      resetCurrentTest: mockResetCurrentTest
    })

    render(<ResultsStep />)

    // Should still render with default values
    expect(screen.getByText('Evaluation Complete')).toBeInTheDocument()
    expect(screen.getByText('Total Tokens')).toBeInTheDocument()
    expect(screen.getByText('Execution Time')).toBeInTheDocument()
    expect(screen.getByText('Cost')).toBeInTheDocument()
  })

  it('calls setCurrentStep when "Run Again" is clicked', () => {
    mockUseAppStore.mockReturnValue({
      currentTest: {
        results: mockResults,
        response: 'Test response',
        model: mockModel,
        tokenUsage: mockTokenUsage,
        executionTime: 2300,
        cost: 0.0045
      },
      setCurrentStep: mockSetCurrentStep,
      resetCurrentTest: mockResetCurrentTest
    })

    render(<ResultsStep />)

    const runAgainButton = screen.getByText('Run Again')
    fireEvent.click(runAgainButton)

    expect(mockSetCurrentStep).toHaveBeenCalledWith(2)
  })

  it('calls resetCurrentTest when "New Test" is clicked', () => {
    mockUseAppStore.mockReturnValue({
      currentTest: {
        results: mockResults,
        response: 'Test response',
        model: mockModel,
        tokenUsage: mockTokenUsage,
        executionTime: 2300,
        cost: 0.0045
      },
      setCurrentStep: mockSetCurrentStep,
      resetCurrentTest: mockResetCurrentTest
    })

    render(<ResultsStep />)

    const newTestButton = screen.getByText('New Test')
    fireEvent.click(newTestButton)

    expect(mockResetCurrentTest).toHaveBeenCalled()
    expect(mockSetCurrentStep).toHaveBeenCalledWith(0)
  })

  it('calls setCurrentStep when "Back to Test" is clicked (no results)', () => {
    mockUseAppStore.mockReturnValue({
      currentTest: {
        results: null,
        response: null,
        model: null,
        tokenUsage: null,
        executionTime: null,
        cost: null
      },
      setCurrentStep: mockSetCurrentStep,
      resetCurrentTest: mockResetCurrentTest
    })

    render(<ResultsStep />)

    const backButton = screen.getByText('Back to Test')
    fireEvent.click(backButton)

    expect(mockSetCurrentStep).toHaveBeenCalledWith(2)
  })
})