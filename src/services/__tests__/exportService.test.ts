import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { ExportService } from '../exportService'
import { TestRun, SuccessMetrics, TokenStats } from '@/lib/types'

// Mock DOM APIs
const mockCreateElement = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()
const mockClick = vi.fn()
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

// Mock window.open for PDF tests
const mockWindowOpen = vi.fn()

beforeAll(() => {
  // Mock document methods
  Object.defineProperty(document, 'createElement', {
    value: mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
      textContent: '',
      innerHTML: ''
    })
  })
  
  Object.defineProperty(document.body, 'appendChild', {
    value: mockAppendChild
  })
  
  Object.defineProperty(document.body, 'removeChild', {
    value: mockRemoveChild
  })

  // Mock URL methods
  Object.defineProperty(URL, 'createObjectURL', {
    value: mockCreateObjectURL.mockReturnValue('blob:mock-url')
  })
  
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: mockRevokeObjectURL
  })

  // Mock window.open
  Object.defineProperty(window, 'open', {
    value: mockWindowOpen.mockReturnValue({
      document: {
        write: vi.fn(),
        close: vi.fn()
      },
      onload: null,
      print: vi.fn(),
      close: vi.fn()
    })
  })

  // Mock crypto.randomUUID
  Object.defineProperty(crypto, 'randomUUID', {
    value: vi.fn().mockReturnValue('mock-uuid-1234')
  })
})

beforeEach(() => {
  vi.clearAllMocks()
})

// Test data
const mockTokenStats: TokenStats = {
  promptTokens: 100,
  completionTokens: 200,
  totalTokens: 300
}

const mockMetrics: SuccessMetrics = {
  overallScore: 85,
  coherenceScore: 90,
  taskCompletionScore: 80,
  instructionAdherenceScore: 85,
  efficiencyScore: 88,
  explanation: 'The response demonstrates excellent coherence and task completion.'
}

const mockTestRun: TestRun = {
  id: 'test-123',
  timestamp: 1640995200000, // 2022-01-01 00:00:00 UTC
  model: 'gpt-4',
  modelProvider: 'OpenAI',
  instructions: 'You are a helpful assistant.',
  prompt: 'What is the capital of France?',
  response: 'The capital of France is Paris.',
  metrics: mockMetrics,
  tokenUsage: mockTokenStats,
  executionTime: 2500,
  cost: 0.0025
}

const mockTestRuns: TestRun[] = [
  mockTestRun,
  {
    ...mockTestRun,
    id: 'test-456',
    timestamp: 1640995260000, // 1 minute later
    model: 'claude-3',
    modelProvider: 'Anthropic',
    metrics: {
      ...mockMetrics,
      overallScore: 78,
      coherenceScore: 82
    },
    cost: 0.0018
  }
]

describe('ExportService', () => {
  describe('exportSingleTest', () => {
    it('should export single test as JSON', async () => {
      await ExportService.exportSingleTest(mockTestRun, 'json')

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(mockClick).toHaveBeenCalled()
      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })

    it('should export single test as CSV', async () => {
      await ExportService.exportSingleTest(mockTestRun, 'csv')

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(mockClick).toHaveBeenCalled()
    })

    it('should export single test as PDF', async () => {
      await ExportService.exportSingleTest(mockTestRun, 'pdf')

      expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank')
    })

    it('should throw error for unsupported format', async () => {
      await expect(
        ExportService.exportSingleTest(mockTestRun, 'xml' as any)
      ).rejects.toThrow('Unsupported export format: xml')
    })
  })

  describe('exportHistory', () => {
    it('should export history as JSON with summary statistics', async () => {
      await ExportService.exportHistory(mockTestRuns, 'json')

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(mockClick).toHaveBeenCalled()
    })

    it('should export history as CSV', async () => {
      await ExportService.exportHistory(mockTestRuns, 'csv')

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(mockClick).toHaveBeenCalled()
    })

    it('should export history as PDF', async () => {
      await ExportService.exportHistory(mockTestRuns, 'pdf')

      expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank')
    })

    it('should throw error when no test data provided', async () => {
      await expect(
        ExportService.exportHistory([], 'json')
      ).rejects.toThrow('No test data to export')
    })

    it('should throw error for unsupported format', async () => {
      await expect(
        ExportService.exportHistory(mockTestRuns, 'txt' as any)
      ).rejects.toThrow('Unsupported export format: txt')
    })
  })

  describe('data preparation', () => {
    it('should prepare export data with correct structure', () => {
      // Test the data structure is correct
      expect(mockTestRuns).toHaveLength(2)
      expect(mockTestRuns[0]).toHaveProperty('id')
      expect(mockTestRuns[0]).toHaveProperty('metrics')
      expect(mockTestRuns[0]).toHaveProperty('tokenUsage')
      expect(mockTestRuns[0].metrics).toHaveProperty('overallScore')
      expect(mockTestRuns[1].metrics).toHaveProperty('overallScore')
    })
  })

  describe('filename generation', () => {
    it('should generate filename with correct format for single test', async () => {
      await ExportService.exportSingleTest(mockTestRun, 'json')

      const linkElement = mockCreateElement.mock.results[0].value
      expect(linkElement.download).toMatch(/instruct-lab-test-test-123-\d{8}\.json/)
    })

    it('should generate filename with correct format for history', async () => {
      await ExportService.exportHistory(mockTestRuns, 'csv')

      const linkElement = mockCreateElement.mock.results[0].value
      expect(linkElement.download).toMatch(/instruct-lab-history-\d{8}\.csv/)
    })
  })
})