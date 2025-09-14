import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EvaluationEngine } from '../evaluationEngine'
import { Model } from '@/lib/types'

// Mock fetch for integration tests
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EvaluationEngine Integration', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should integrate with store workflow', async () => {
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-3.5-turbo',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'You are a helpful assistant that provides clear and concise answers.'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 25,
            completion_tokens: 15,
            total_tokens: 40
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'eval-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'openai/gpt-4-turbo-preview',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                overallScore: 88,
                coherenceScore: 90,
                taskCompletionScore: 85,
                instructionAdherenceScore: 90,
                efficiencyScore: 87,
                explanation: 'The response follows the instructions well and provides a clear, helpful answer.'
              })
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 200,
            completion_tokens: 75,
            total_tokens: 275
          }
        })
      })

    // Simulate store calling evaluation engine
    const testParams = {
      apiKey: 'sk-or-test-key-12345',
      model: mockModel,
      systemInstructions: 'You are a helpful assistant that provides clear and concise answers.',
      userPrompt: 'Explain what artificial intelligence is in simple terms.',
      temperature: 0.7,
      maxTokens: 1000
    }

    const result = await EvaluationEngine.executeEvaluation(testParams)

    // Verify the result structure matches what the store expects
    expect(result).toHaveProperty('response')
    expect(result).toHaveProperty('metrics')
    expect(result).toHaveProperty('tokenUsage')
    expect(result).toHaveProperty('executionTime')
    expect(result).toHaveProperty('cost')

    // Verify metrics structure
    expect(result.metrics).toEqual({
      overallScore: 88,
      coherenceScore: 90,
      taskCompletionScore: 85,
      instructionAdherenceScore: 90,
      efficiencyScore: 87,
      explanation: 'The response follows the instructions well and provides a clear, helpful answer.'
    })

    // Verify token usage structure
    expect(result.tokenUsage).toEqual({
      promptTokens: 25,
      completionTokens: 15,
      totalTokens: 40
    })

    // Verify execution time is reasonable (should be at least 0, could be 0 in tests due to mocking)
    expect(result.executionTime).toBeGreaterThanOrEqual(0)
    expect(result.executionTime).toBeLessThan(10000) // Should be less than 10 seconds

    // Verify cost calculation
    expect(result.cost).toBeGreaterThan(0)
    expect(typeof result.cost).toBe('number')
  })

  it('should handle real-world instruction scenarios', async () => {
    // Mock responses for a more complex scenario
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'complex-test',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-3.5-turbo',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: `# Product Requirements Document

## Overview
This document outlines the requirements for a new mobile application.

## Features
1. User authentication
2. Data synchronization
3. Offline capabilities

## Technical Requirements
- React Native framework
- RESTful API integration
- Local storage implementation`
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 150,
            completion_tokens: 120,
            total_tokens: 270
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'complex-eval',
          object: 'chat.completion',
          created: Date.now(),
          model: 'openai/gpt-4-turbo-preview',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                overallScore: 92,
                coherenceScore: 95,
                taskCompletionScore: 90,
                instructionAdherenceScore: 88,
                efficiencyScore: 95,
                explanation: 'Excellent structured response that follows the PRD format perfectly. All required sections are present and well-organized.'
              })
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 300,
            completion_tokens: 100,
            total_tokens: 400
          }
        })
      })

    const complexTestParams = {
      apiKey: 'sk-or-test-key-12345',
      model: mockModel,
      systemInstructions: `You are a technical product manager. When asked to create documentation, always use markdown formatting and include these sections:
1. Overview
2. Features (as numbered list)
3. Technical Requirements (as bulleted list)

Keep responses concise but comprehensive.`,
      userPrompt: 'Create a product requirements document for a new mobile app with user authentication, data sync, and offline capabilities.',
      temperature: 0.3,
      maxTokens: 2000
    }

    const result = await EvaluationEngine.executeEvaluation(complexTestParams)

    // Verify high-quality results for well-structured instructions
    expect(result.metrics.overallScore).toBeGreaterThan(85)
    expect(result.metrics.instructionAdherenceScore).toBeGreaterThan(80)
    expect(result.response).toContain('# Product Requirements Document')
    expect(result.tokenUsage.totalTokens).toBeGreaterThan(200) // Complex response should use more tokens
  })
})