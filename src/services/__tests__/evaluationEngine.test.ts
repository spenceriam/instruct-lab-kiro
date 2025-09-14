import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EvaluationEngine, TestParams, OpenRouterResponse } from '../evaluationEngine'
import { Model } from '@/lib/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EvaluationEngine', () => {
  const mockModel: Model = {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    contextLength: 4096,
    pricing: {
      prompt: 0.002,
      completion: 0.002
    }
  }

  const mockTestParams: TestParams = {
    apiKey: 'sk-or-test-key',
    model: mockModel,
    systemInstructions: 'You are a helpful assistant.',
    userPrompt: 'What is the capital of France?',
    temperature: 0.7,
    maxTokens: 1000
  }

  const mockPrimaryResponse: OpenRouterResponse = {
    id: 'test-id',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-3.5-turbo',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: 'The capital of France is Paris.'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 20,
      completion_tokens: 10,
      total_tokens: 30
    }
  }

  const mockEvaluationResponse: OpenRouterResponse = {
    id: 'eval-id',
    object: 'chat.completion',
    created: Date.now(),
    model: 'openai/gpt-4-turbo-preview',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          overallScore: 85,
          coherenceScore: 90,
          taskCompletionScore: 85,
          instructionAdherenceScore: 80,
          efficiencyScore: 85,
          explanation: 'The response correctly identifies Paris as the capital of France.'
        })
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 150,
      completion_tokens: 50,
      total_tokens: 200
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('executeEvaluation', () => {
    it('should execute complete dual-model evaluation successfully', async () => {
      // Mock the two API calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPrimaryResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEvaluationResponse)
        })

      const result = await EvaluationEngine.executeEvaluation(mockTestParams)

      expect(result).toEqual({
        response: 'The capital of France is Paris.',
        metrics: {
          overallScore: 85,
          coherenceScore: 90,
          taskCompletionScore: 85,
          instructionAdherenceScore: 80,
          efficiencyScore: 85,
          explanation: 'The response correctly identifies Paris as the capital of France.'
        },
        tokenUsage: {
          promptTokens: 20,
          completionTokens: 10,
          totalTokens: 30
        },
        executionTime: expect.any(Number),
        cost: expect.any(Number)
      })

      // Verify API calls were made correctly
      expect(mockFetch).toHaveBeenCalledTimes(2)
      
      // Check primary test call
      expect(mockFetch).toHaveBeenNthCalledWith(1, 
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-or-test-key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"model":"gpt-3.5-turbo"')
        })
      )

      // Check evaluation call
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-or-test-key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"model":"openai/gpt-4-turbo-preview"')
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('{"error":{"message":"Invalid API key"}}')
      })

      await expect(EvaluationEngine.executeEvaluation(mockTestParams))
        .rejects.toThrow('Evaluation failed: Invalid API key')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(EvaluationEngine.executeEvaluation(mockTestParams))
        .rejects.toThrow('Evaluation failed: Network error')
    })

    it('should handle missing response choices', async () => {
      const responseWithoutChoices = {
        ...mockPrimaryResponse,
        choices: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseWithoutChoices)
      })

      await expect(EvaluationEngine.executeEvaluation(mockTestParams))
        .rejects.toThrow('Evaluation failed: No response choices received')
    })
  })

  describe('calculateOverallScore', () => {
    it('should calculate weighted average correctly', () => {
      const metrics = {
        coherenceScore: 80,
        taskCompletionScore: 90,
        instructionAdherenceScore: 85,
        efficiencyScore: 75
      }

      const overallScore = EvaluationEngine.calculateOverallScore(metrics)
      
      // Expected: (90*0.3) + (85*0.3) + (80*0.25) + (75*0.15) = 27 + 25.5 + 20 + 11.25 = 83.75 ≈ 84
      expect(overallScore).toBe(84)
    })

    it('should handle edge case scores', () => {
      const metrics = {
        coherenceScore: 0,
        taskCompletionScore: 100,
        instructionAdherenceScore: 50,
        efficiencyScore: 25
      }

      const overallScore = EvaluationEngine.calculateOverallScore(metrics)
      expect(overallScore).toBeGreaterThanOrEqual(0)
      expect(overallScore).toBeLessThanOrEqual(100)
    })
  })

  describe('evaluation prompt template', () => {
    it('should build comprehensive evaluation prompt', () => {
      // This is testing the private method indirectly through the public API
      const instructions = 'Be helpful and concise'
      const prompt = 'What is AI?'

      // We can't directly test the private method, but we can verify it's used
      // by checking that the evaluation request contains the expected content
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPrimaryResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEvaluationResponse)
        })

      const testParams = {
        ...mockTestParams,
        systemInstructions: instructions,
        userPrompt: prompt
      }

      return EvaluationEngine.executeEvaluation(testParams).then(() => {
        const evaluationCall = mockFetch.mock.calls[1]
        const requestBody = JSON.parse(evaluationCall[1].body)
        const evaluationPrompt = requestBody.messages[1].content

        expect(evaluationPrompt).toContain('SYSTEM INSTRUCTIONS:')
        expect(evaluationPrompt).toContain('USER PROMPT:')
        expect(evaluationPrompt).toContain('AI RESPONSE:')
        expect(evaluationPrompt).toContain('COHERENCE')
        expect(evaluationPrompt).toContain('TASK COMPLETION')
        expect(evaluationPrompt).toContain('INSTRUCTION ADHERENCE')
        expect(evaluationPrompt).toContain('EFFICIENCY')
      })
    })
  })

  describe('evaluation response parsing', () => {
    it('should handle malformed evaluation response gracefully', async () => {
      const malformedEvaluationResponse = {
        ...mockEvaluationResponse,
        choices: [{
          ...mockEvaluationResponse.choices[0],
          message: {
            role: 'assistant' as const,
            content: 'This is not valid JSON for evaluation'
          }
        }]
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPrimaryResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(malformedEvaluationResponse)
        })

      const result = await EvaluationEngine.executeEvaluation(mockTestParams)

      // Should fallback to default scores
      expect(result.metrics).toEqual({
        overallScore: 50,
        coherenceScore: 50,
        taskCompletionScore: 50,
        instructionAdherenceScore: 50,
        efficiencyScore: 50,
        explanation: 'Evaluation parsing failed. Default scores applied.'
      })
    })

    it('should handle evaluation response with extra text around JSON', async () => {
      const responseWithExtraText = {
        ...mockEvaluationResponse,
        choices: [{
          ...mockEvaluationResponse.choices[0],
          message: {
            role: 'assistant' as const,
            content: `Here is my evaluation:

${JSON.stringify({
  overallScore: 92,
  coherenceScore: 95,
  taskCompletionScore: 90,
  instructionAdherenceScore: 88,
  efficiencyScore: 94,
  explanation: 'Excellent response with clear and accurate information.'
})}

This completes the evaluation.`
          }
        }]
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPrimaryResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(responseWithExtraText)
        })

      const result = await EvaluationEngine.executeEvaluation(mockTestParams)

      expect(result.metrics).toEqual({
        overallScore: 92,
        coherenceScore: 95,
        taskCompletionScore: 90,
        instructionAdherenceScore: 88,
        efficiencyScore: 94,
        explanation: 'Excellent response with clear and accurate information.'
      })
    })
  })
})