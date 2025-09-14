/**
 * Integration tests for ExportService - End-to-end export functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ExportService } from '../exportService'
import { TestRun, SuccessMetrics, TokenStats } from '@/lib/types'

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()

Object.defineProperty(global.URL, 'createObjectURL', {
  value: mockCreateObjectURL
})

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
})

// Mock document.createElement and click behavior
const mockClick = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()

const mockAnchorElement = {
  href: '',
  download: '',
  click: mockClick,
  style: { display: '' }
}

const mockDocument = {
  createElement: vi.fn(() => mockAnchorElement),
  body: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild
  }
}

describe('ExportService Integration', () => {
  const mockMetrics: SuccessMetrics = {
    overallScore: 85,
    coherenceScore: 90,
    taskCompletionScore: 80,
    instructionAdherenceScore: 88,
    efficiencyScore: 82,
    explanation: 'The response demonstrates good coherence and task completion.'
  }

  const mockTokenStats: TokenStats = {
    promptTokens: 150,
    completionTokens: 200,
    totalTokens: 350
  }

  const mockTestRun: TestRun = {
    id: 'test-run-1',
    timestamp: new Date('2024-01-15T10:30:00Z').getTime(),
    model: 'gpt-4',
    modelProvider: 'OpenAI',
    instructions: 'You are a helpful assistant that provides clear and concise answers.',
    prompt: 'Explain the concept of machine learning in simple terms.',
    response: 'Machine learning is a type of artificial intelligence where computers learn to make predictions or decisions by finding patterns in data, rather than being explicitly programmed for every possible scenario.',
    metrics: mockMetrics,
    tokenUsage: mockTokenStats,
    executionTime: 2500,
    cost: 0.0045
  }

  const mockTestRuns: TestRun[] = [
    mockTestRun,
    {
      ...mockTestRun,
      id: 'test-run-2',
      timestamp: new Date('2024-01-15T11:00:00Z').getTime(),
      model: 'claude-3-opus',
      modelProvider: 'Anthropic',
      metrics: {
        ...mockMetrics,
        overallScore: 92,
        coherenceScore: 95
      },
      cost: 0.0038
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    global.document = mockDocument as any
    global.Blob = vi.fn().mockImplementation((content, options) => ({
      content,
      options,
      size: content[0].length,
      type: options?.type || 'text/plain'
    })) as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('JSON export integration', () => {
    it('should export single test run as JSON', async () => {
      await ExportService.exportTestRun(mockTestRun, 'json')
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('"testRun"')],
        { type: 'application/json' }
      )
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('a')
      expect(mockAnchorElement.download).toMatch(/instruct-lab-test-.*\.json/)
      expect(mockClick).toHaveBeenCalled()
    })

    it('should export multiple test runs as JSON', async () => {
      await ExportService.exportTestHistory(mockTestRuns, 'json')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const jsonContent = blobCall[0][0]
      
      expect(jsonContent).toContain('"testRuns"')
      expect(jsonContent).toContain('"summary"')
      expect(jsonContent).toContain('"exportDate"')
      
      expect(mockAnchorElement.download).toMatch(/instruct-lab-history-.*\.json/)
    })

    it('should include complete test data in JSON export', async () => {
      await ExportService.exportTestRun(mockTestRun, 'json')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const jsonContent = JSON.parse(blobCall[0][0])
      
      expect(jsonContent).toEqual({
        testRun: mockTestRun,
        exportedAt: expect.any(String),
        version: '1.0'
      })
    })
  })

  describe('CSV export integration', () => {
    it('should export single test run as CSV', async () => {
      await ExportService.exportTestRun(mockTestRun, 'csv')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const csvContent = blobCall[0][0]
      
      expect(csvContent).toContain('Timestamp,Model,Provider,Overall Score')
      expect(csvContent).toContain('gpt-4,OpenAI,85')
      expect(csvContent).toContain('85,90,80,88,82') // Individual scores
      
      expect(mockAnchorElement.download).toMatch(/instruct-lab-test-.*\.csv/)
    })

    it('should export multiple test runs as CSV', async () => {
      await ExportService.exportTestHistory(mockTestRuns, 'csv')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const csvContent = blobCall[0][0]
      
      // Should have header row plus 2 data rows
      const rows = csvContent.split('\n').filter(row => row.trim())
      expect(rows).toHaveLength(3) // Header + 2 test runs
      
      expect(csvContent).toContain('gpt-4,OpenAI,85')
      expect(csvContent).toContain('claude-3-opus,Anthropic,92')
    })

    it('should handle CSV escaping for special characters', async () => {
      const testWithSpecialChars = {
        ...mockTestRun,
        instructions: 'Instructions with "quotes" and, commas',
        response: 'Response with\nnewlines and "quotes"'
      }
      
      await ExportService.exportTestRun(testWithSpecialChars, 'csv')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const csvContent = blobCall[0][0]
      
      expect(csvContent).toContain('"Instructions with ""quotes"" and, commas"')
      expect(csvContent).toContain('"Response with\nnewlines and ""quotes"""')
    })
  })

  describe('PDF export integration', () => {
    it('should export single test run as PDF', async () => {
      await ExportService.exportTestRun(mockTestRun, 'pdf')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const pdfContent = blobCall[0][0]
      
      expect(pdfContent).toContain('Instruct-Lab Test Report')
      expect(pdfContent).toContain('Overall Score: 85%')
      expect(pdfContent).toContain('Model: gpt-4 (OpenAI)')
      expect(pdfContent).toContain('Execution Time: 2.5s')
      
      expect(blobCall[1]).toEqual({ type: 'application/pdf' })
      expect(mockAnchorElement.download).toMatch(/instruct-lab-test-.*\.pdf/)
    })

    it('should export multiple test runs as PDF report', async () => {
      await ExportService.exportTestHistory(mockTestRuns, 'pdf')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const pdfContent = blobCall[0][0]
      
      expect(pdfContent).toContain('Instruct-Lab Test History Report')
      expect(pdfContent).toContain('Total Tests: 2')
      expect(pdfContent).toContain('Average Score: 89%')
      expect(pdfContent).toContain('claude-3-opus')
      expect(pdfContent).toContain('gpt-4')
    })

    it('should include charts and visualizations in PDF', async () => {
      await ExportService.exportTestHistory(mockTestRuns, 'pdf')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const pdfContent = blobCall[0][0]
      
      expect(pdfContent).toContain('Score Distribution')
      expect(pdfContent).toContain('Model Performance Comparison')
      expect(pdfContent).toContain('Cost Analysis')
    })
  })

  describe('error handling integration', () => {
    it('should handle blob creation errors', async () => {
      vi.mocked(global.Blob).mockImplementation(() => {
        throw new Error('Blob creation failed')
      })
      
      await expect(ExportService.exportTestRun(mockTestRun, 'json'))
        .rejects.toThrow('Failed to export test run')
    })

    it('should handle download trigger errors', async () => {
      mockClick.mockImplementation(() => {
        throw new Error('Download failed')
      })
      
      await expect(ExportService.exportTestRun(mockTestRun, 'json'))
        .rejects.toThrow('Failed to export test run')
    })

    it('should clean up resources on error', async () => {
      mockClick.mockImplementation(() => {
        throw new Error('Download failed')
      })
      
      try {
        await ExportService.exportTestRun(mockTestRun, 'json')
      } catch (error) {
        // Error expected
      }
      
      expect(mockRevokeObjectURL).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()
    })
  })

  describe('file naming integration', () => {
    it('should generate unique filenames for concurrent exports', async () => {
      const exports = [
        ExportService.exportTestRun(mockTestRun, 'json'),
        ExportService.exportTestRun(mockTestRun, 'csv'),
        ExportService.exportTestRun(mockTestRun, 'pdf')
      ]
      
      await Promise.all(exports)
      
      const downloadCalls = mockAnchorElement.download
      expect(mockClick).toHaveBeenCalledTimes(3)
    })

    it('should handle special characters in model names', async () => {
      const testWithSpecialModel = {
        ...mockTestRun,
        model: 'gpt-4/turbo-preview',
        modelProvider: 'OpenAI/Azure'
      }
      
      await ExportService.exportTestRun(testWithSpecialModel, 'json')
      
      // Should sanitize filename
      expect(mockAnchorElement.download).toMatch(/instruct-lab-test-.*\.json/)
    })
  })

  describe('data integrity integration', () => {
    it('should preserve all test data through export/import cycle', async () => {
      await ExportService.exportTestRun(mockTestRun, 'json')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const exportedData = JSON.parse(blobCall[0][0])
      
      // Verify all critical data is preserved
      expect(exportedData.testRun.id).toBe(mockTestRun.id)
      expect(exportedData.testRun.instructions).toBe(mockTestRun.instructions)
      expect(exportedData.testRun.response).toBe(mockTestRun.response)
      expect(exportedData.testRun.metrics).toEqual(mockTestRun.metrics)
      expect(exportedData.testRun.tokenUsage).toEqual(mockTestRun.tokenUsage)
    })

    it('should maintain precision for numerical values', async () => {
      const testWithPreciseValues = {
        ...mockTestRun,
        cost: 0.00123456789,
        executionTime: 1234.567
      }
      
      await ExportService.exportTestRun(testWithPreciseValues, 'json')
      
      const blobCall = vi.mocked(global.Blob).mock.calls[0]
      const exportedData = JSON.parse(blobCall[0][0])
      
      expect(exportedData.testRun.cost).toBe(0.00123456789)
      expect(exportedData.testRun.executionTime).toBe(1234.567)
    })
  })

  describe('performance integration', () => {
    it('should handle large test history exports efficiently', async () => {
      const largeTestHistory = Array.from({ length: 100 }, (_, i) => ({
        ...mockTestRun,
        id: `test-run-${i}`,
        timestamp: Date.now() + i * 1000
      }))
      
      const startTime = Date.now()
      await ExportService.exportTestHistory(largeTestHistory, 'json')
      const endTime = Date.now()
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      
      expect(mockClick).toHaveBeenCalled()
    })

    it('should handle exports with large text content', async () => {
      const testWithLargeContent = {
        ...mockTestRun,
        instructions: 'A'.repeat(10000), // 10KB of instructions
        response: 'B'.repeat(50000) // 50KB of response
      }
      
      await ExportService.exportTestRun(testWithLargeContent, 'json')
      
      expect(mockClick).toHaveBeenCalled()
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.any(String)],
        { type: 'application/json' }
      )
    })
  })

  describe('browser compatibility integration', () => {
    it('should work with different blob implementations', async () => {
      // Test with minimal blob implementation
      global.Blob = vi.fn().mockImplementation((content) => ({
        content,
        size: content[0]?.length || 0
      })) as any
      
      await ExportService.exportTestRun(mockTestRun, 'json')
      
      expect(mockClick).toHaveBeenCalled()
    })

    it('should handle URL.createObjectURL unavailability', async () => {
      const originalCreateObjectURL = global.URL.createObjectURL
      global.URL.createObjectURL = undefined as any
      
      await expect(ExportService.exportTestRun(mockTestRun, 'json'))
        .rejects.toThrow()
      
      global.URL.createObjectURL = originalCreateObjectURL
    })
  })
})