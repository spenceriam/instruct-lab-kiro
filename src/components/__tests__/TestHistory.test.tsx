import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TestHistory from '../TestHistory'
import { TestRun, SuccessMetrics, TokenStats } from '@/lib/types'

// Mock data
const mockMetrics: SuccessMetrics = {
  overallScore: 85,
  coherenceScore: 90,
  taskCompletionScore: 80,
  instructionAdherenceScore: 88,
  efficiencyScore: 82,
  explanation: 'Test explanation'
}

const mockTokenStats: TokenStats = {
  promptTokens: 100,
  completionTokens: 200,
  totalTokens: 300
}

const mockTestRun: TestRun = {
  id: 'test-1',
  timestamp: Date.now(),
  model: 'gpt-4',
  modelProvider: 'OpenAI',
  instructions: 'Test instructions',
  prompt: 'Test prompt',
  response: 'Test response',
  metrics: mockMetrics,
  tokenUsage: mockTokenStats,
  executionTime: 1500,
  cost: 0.0025
}

const mockTestRuns: TestRun[] = [
  mockTestRun,
  {
    ...mockTestRun,
    id: 'test-2',
    model: 'claude-3',
    modelProvider: 'Anthropic',
    metrics: {
      ...mockMetrics,
      overallScore: 75,
      coherenceScore: 70
    },
    cost: 0.0018
  }
]

describe('TestHistory', () => {
  const mockOnStartTesting = vi.fn()
  const mockOnClearHistory = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty State', () => {
    it('renders empty state when no test runs exist', () => {
      render(
        <TestHistory
          testRuns={[]}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      expect(screen.getByText('No tests yet')).toBeInTheDocument()
      expect(screen.getByText('Run Your First Test')).toBeInTheDocument()
      expect(screen.getByText(/Run your first evaluation to see quantitative metrics/)).toBeInTheDocument()
    })

    it('calls onStartTesting when "Run Your First Test" button is clicked', () => {
      render(
        <TestHistory
          testRuns={[]}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      fireEvent.click(screen.getByText('Run Your First Test'))
      expect(mockOnStartTesting).toHaveBeenCalledTimes(1)
    })
  })

  describe('History Table', () => {
    it('renders history table when test runs exist', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      expect(screen.getByText('Your Test History')).toBeInTheDocument()
      expect(screen.getByText('2 tests completed')).toBeInTheDocument()
      expect(screen.getByText('New Test')).toBeInTheDocument()
      expect(screen.getByText('Clear History')).toBeInTheDocument()
    })

    it('displays all test run data correctly', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      // Check model names
      expect(screen.getByText('gpt-4')).toBeInTheDocument()
      expect(screen.getByText('claude-3')).toBeInTheDocument()

      // Check providers
      expect(screen.getByText('OpenAI')).toBeInTheDocument()
      expect(screen.getByText('Anthropic')).toBeInTheDocument()

      // Check scores
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()

      // Check token usage (should appear in table)
      expect(screen.getAllByText('300')).toHaveLength(2) // Two test runs with same token count

      // Check costs
      expect(screen.getByText('$0.0025')).toBeInTheDocument()
      expect(screen.getByText('$0.0018')).toBeInTheDocument()
    })

    it('formats execution time correctly', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      expect(screen.getAllByText('1.5s')).toHaveLength(2) // Two test runs with same execution time
    })

    it('applies correct color classes for scores', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      // High score (85%) should have success color
      const highScoreElement = screen.getByText('85%')
      expect(highScoreElement).toHaveClass('text-success')

      // Medium score (75%) should have warning color
      const mediumScoreElement = screen.getByText('75%')
      expect(mediumScoreElement).toHaveClass('text-warning')
    })

    it('calls onStartTesting when "New Test" button is clicked', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      fireEvent.click(screen.getByText('New Test'))
      expect(mockOnStartTesting).toHaveBeenCalledTimes(1)
    })
  })

  describe('Clear History Functionality', () => {
    it('shows confirmation dialog when clear history is clicked', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      fireEvent.click(screen.getByText('Clear History'))
      
      expect(screen.getByText('Clear Test History')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to clear all test history/)).toBeInTheDocument()
    })

    it('calls onClearHistory when confirmation is accepted', async () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      // Open confirmation dialog
      fireEvent.click(screen.getByText('Clear History'))
      
      // Confirm the action - click the button in the modal, not the header button
      fireEvent.click(screen.getByRole('button', { name: 'Clear History' }))
      
      await waitFor(() => {
        expect(mockOnClearHistory).toHaveBeenCalledTimes(1)
      })
    })

    it('does not call onClearHistory when confirmation is cancelled', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      // Open confirmation dialog
      fireEvent.click(screen.getByText('Clear History'))
      
      // Cancel the action
      fireEvent.click(screen.getByText('Cancel'))
      
      expect(mockOnClearHistory).not.toHaveBeenCalled()
    })

    it('disables clear button when loading', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
          isLoading={true}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear/ })
      expect(clearButton).toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(
        <TestHistory
          testRuns={mockTestRuns}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
          isLoading={true}
        />
      )

      expect(screen.getByText('Loading history...')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      const testDate = new Date('2024-01-15T14:30:00Z')
      const testRunWithSpecificDate: TestRun = {
        ...mockTestRun,
        timestamp: testDate.getTime()
      }

      render(
        <TestHistory
          testRuns={[testRunWithSpecificDate]}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      // Check that date is formatted (exact format may vary by locale)
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })
  })

  describe('Cost Formatting', () => {
    it('formats very small costs correctly', () => {
      const testRunWithSmallCost: TestRun = {
        ...mockTestRun,
        cost: 0.0005
      }

      render(
        <TestHistory
          testRuns={[testRunWithSmallCost]}
          onStartTesting={mockOnStartTesting}
          onClearHistory={mockOnClearHistory}
        />
      )

      expect(screen.getByText('<$0.001')).toBeInTheDocument()
    })
  })
})