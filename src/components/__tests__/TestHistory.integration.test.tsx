import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'
import TestHistory from '../TestHistory'

// Mock the store
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn()
}))

describe('TestHistory Integration', () => {
  const mockStore = {
    testHistory: [],
    startTest: vi.fn(),
    clearHistory: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore)
  })

  it('integrates properly with the store', () => {
    const mockOnStartTesting = vi.fn()
    render(<TestHistory onStartTesting={mockOnStartTesting} />)
    
    // Should show empty state when no history
    expect(screen.getByText('No tests yet')).toBeInTheDocument()
    
    // Should call onStartTesting when button is clicked
    fireEvent.click(screen.getByText('Run Your First Test'))
    expect(mockOnStartTesting).toHaveBeenCalled()
  })

  it('handles store updates correctly', () => {
    const testRun = {
      id: 'test-1',
      timestamp: Date.now(),
      model: 'gpt-4',
      modelProvider: 'OpenAI',
      instructions: 'Test instructions',
      prompt: 'Test prompt',
      response: 'Test response',
      metrics: {
        overallScore: 85,
        coherenceScore: 90,
        taskCompletionScore: 80,
        instructionAdherenceScore: 88,
        efficiencyScore: 82,
        explanation: 'Test explanation'
      },
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300
      },
      executionTime: 1500,
      cost: 0.0025
    }

    render(<TestHistory testRuns={[testRun]} />)
    
    // Should show history table
    expect(screen.getByText('Your Test History')).toBeInTheDocument()
    expect(screen.getByText('gpt-4')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
  })
})