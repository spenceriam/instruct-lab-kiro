import { Model, SuccessMetrics, TokenStats } from '@/lib/types'
import { 
  openRouterService, 
  OpenRouterRequest, 
  OpenRouterResponse 
} from './openRouterService'
import { 
  ErrorRecoveryManager, 
  AppError,
  ErrorClassifier 
} from '@/lib/errorHandling'

export interface TestParams {
  apiKey: string
  model: Model
  evaluationModel: Model
  systemInstructions: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

export interface EvaluationParams {
  response: string
  instructions: string
  prompt: string
  apiKey: string
  evaluationModel: Model
}

export interface TestResult {
  response: string
  metrics: SuccessMetrics
  tokenUsage: TokenStats
  executionTime: number
  cost: number
}

export interface CostBreakdown {
  primaryTest: number
  evaluation: number
  total: number
}

/**
 * EvaluationEngine orchestrates the dual-model evaluation process:
 * 1. Execute the primary test with the user's selected model
 * 2. Evaluate the response using GPT-4 for scoring
 * 3. Calculate metrics and costs
 */
export class EvaluationEngine {
  private static readonly OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
  private static readonly DEFAULT_TEMPERATURE = 0.7
  private static readonly DEFAULT_MAX_TOKENS = 1000
  private static readonly EVALUATION_MAX_TOKENS = 500

  /**
   * Execute the complete dual-model evaluation workflow
   */
  static async executeEvaluation(params: TestParams): Promise<TestResult> {
    const operationId = `evaluation_${Date.now()}`
    const startTime = Date.now()

    try {
      // Preserve evaluation parameters for recovery
      ErrorRecoveryManager.preserveUserInput(operationId, {
        model: params.model,
        systemInstructions: params.systemInstructions,
        userPrompt: params.userPrompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        startTime
      })

      // Step 1: Execute primary test with user's selected model
      const primaryResponse = await this.executePrimaryTest(params, operationId)
      
      // Step 2: Evaluate the response using user's selected evaluation model
      const evaluationParams: EvaluationParams = {
        response: primaryResponse.choices[0].message.content,
        instructions: params.systemInstructions,
        prompt: params.userPrompt,
        apiKey: params.apiKey,
        evaluationModel: params.evaluationModel
      }
      
      const evaluationResult = await this.evaluateResponse(evaluationParams, operationId)
      
      // Step 3: Calculate execution time and costs
      const executionTime = Date.now() - startTime
      
      // Create token usage from primary response
      const tokenUsage: TokenStats = {
        promptTokens: primaryResponse.usage.prompt_tokens,
        completionTokens: primaryResponse.usage.completion_tokens,
        totalTokens: primaryResponse.usage.total_tokens
      }
      
      const cost = this.calculateCost(primaryResponse, evaluationResult.evaluationTokens, params.model, params.evaluationModel)
      
      // Clear recovery state on success
      ErrorRecoveryManager.clearRecoveryState(operationId)
      
      return {
        response: primaryResponse.choices[0].message.content,
        metrics: evaluationResult.metrics,
        tokenUsage,
        executionTime,
        cost
      }
    } catch (error) {
      const appError = error instanceof Error ? ErrorClassifier.classifyError(error) : error as AppError
      
      // Add "Evaluation failed:" prefix to error message
      if (!appError.message.startsWith('Evaluation failed:')) {
        appError.message = `Evaluation failed: ${appError.message}`
      }
      
      // Add evaluation context
      appError.context = {
        ...appError.context,
        operation: 'evaluation',
        model: params.model.id,
        instructionsLength: params.systemInstructions.length,
        promptLength: params.userPrompt.length,
        executionTime: Date.now() - startTime
      }
      
      throw appError
    }
  }

  /**
   * Execute the primary test using the user's selected model and instructions
   */
  private static async executePrimaryTest(params: TestParams, operationId: string): Promise<OpenRouterResponse> {
    const request: OpenRouterRequest = {
      model: params.model.id,
      messages: [
        {
          role: 'system',
          content: params.systemInstructions
        },
        {
          role: 'user',
          content: params.userPrompt
        }
      ],
      temperature: params.temperature ?? this.DEFAULT_TEMPERATURE,
      max_tokens: params.maxTokens ?? this.DEFAULT_MAX_TOKENS
    }

    try {
      const response = await openRouterService.chatCompletion(params.apiKey, request)
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('Evaluation failed: No response generated from the model')
      }

      return response
    } catch (error) {
      const appError = error as AppError
      appError.context = {
        ...appError.context,
        phase: 'primary_test',
        model: params.model.id,
        operationId
      }
      throw appError
    }
  }

  /**
   * Evaluate the primary response using GPT-4 to generate success metrics
   */
  private static async evaluateResponse(params: EvaluationParams, operationId: string): Promise<{
    metrics: SuccessMetrics
    evaluationTokens: TokenStats
  }> {
    const evaluationPrompt = this.buildEvaluationPrompt(
      params.instructions,
      params.prompt,
      params.response
    )

    const request: OpenRouterRequest = {
      model: params.evaluationModel.id,
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI evaluator. Analyze the given response and provide detailed scoring based on the criteria provided. Return your evaluation in the exact JSON format requested.'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent evaluation
      max_tokens: this.EVALUATION_MAX_TOKENS
    }

    try {
      const response = await openRouterService.chatCompletion(params.apiKey, request)
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('Evaluation failed: No evaluation response generated')
      }

      const metrics = this.parseEvaluationResponse(response.choices[0].message.content)
      const evaluationTokens: TokenStats = {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      }
      
      return { metrics, evaluationTokens }
    } catch (error) {
      const appError = error as AppError
      appError.context = {
        ...appError.context,
        phase: 'evaluation',
        evaluationModel: params.evaluationModel.id,
        operationId
      }
      throw appError
    }
  }

  /**
   * Build the evaluation prompt template for consistent scoring
   */
  private static buildEvaluationPrompt(
    instructions: string,
    prompt: string,
    response: string
  ): string {
    return `Please evaluate the following AI response based on how well it follows the given system instructions and addresses the user prompt.

SYSTEM INSTRUCTIONS:
${instructions}

USER PROMPT:
${prompt}

AI RESPONSE:
${response}

Please provide a detailed evaluation with scores from 0-100 for each criterion:

1. COHERENCE (0-100): How logical, clear, and well-structured is the response?
2. TASK COMPLETION (0-100): How completely does the response address the user's request?
3. INSTRUCTION ADHERENCE (0-100): How well does the response follow the system instructions?
4. EFFICIENCY (0-100): How concise and relevant is the response without unnecessary content?

Also provide:
- An overall success probability score (0-100) that represents the weighted average
- A brief explanation of the scoring rationale

Return your evaluation in this exact JSON format:
{
  "overallScore": 85,
  "coherenceScore": 90,
  "taskCompletionScore": 85,
  "instructionAdherenceScore": 80,
  "efficiencyScore": 85,
  "explanation": "Brief explanation of the scoring rationale and key strengths/weaknesses"
}

Ensure the JSON is valid and contains only the requested fields with numeric scores between 0-100.`
  }

  /**
   * Parse the evaluation response and extract metrics
   */
  private static parseEvaluationResponse(evaluationText: string): SuccessMetrics {
    try {
      // Extract JSON from the response (handle cases where there might be extra text)
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Evaluation failed: No JSON found in evaluation response')
      }

      const evaluation = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      const requiredFields = [
        'overallScore',
        'coherenceScore', 
        'taskCompletionScore',
        'instructionAdherenceScore',
        'efficiencyScore',
        'explanation'
      ]
      
      for (const field of requiredFields) {
        if (!(field in evaluation)) {
          throw new Error(`Evaluation failed: Missing required field: ${field}`)
        }
      }

      // Validate score ranges
      const scoreFields = [
        'overallScore',
        'coherenceScore',
        'taskCompletionScore', 
        'instructionAdherenceScore',
        'efficiencyScore'
      ]
      
      for (const field of scoreFields) {
        const score = evaluation[field]
        if (typeof score !== 'number' || score < 0 || score > 100) {
          throw new Error(`Evaluation failed: Invalid score for ${field}: ${score}`)
        }
      }

      return {
        overallScore: Math.round(evaluation.overallScore),
        coherenceScore: Math.round(evaluation.coherenceScore),
        taskCompletionScore: Math.round(evaluation.taskCompletionScore),
        instructionAdherenceScore: Math.round(evaluation.instructionAdherenceScore),
        efficiencyScore: Math.round(evaluation.efficiencyScore),
        explanation: evaluation.explanation
      }
    } catch (error) {
      // Fallback scoring if evaluation parsing fails
      console.error('Failed to parse evaluation response:', error)
      return {
        overallScore: 50,
        coherenceScore: 50,
        taskCompletionScore: 50,
        instructionAdherenceScore: 50,
        efficiencyScore: 50,
        explanation: 'Evaluation parsing failed. Default scores applied.'
      }
    }
  }

  // Removed makeOpenRouterRequest method as we now use openRouterService

  /**
   * Calculate the total cost of the evaluation including both API calls
   */
  private static calculateCost(
    primaryResponse: OpenRouterResponse,
    evaluationTokens: TokenStats,
    model: Model,
    evaluationModel: Model
  ): number {
    // Calculate primary test cost
    const primaryPromptCost = (primaryResponse.usage.prompt_tokens / 1000000) * model.pricing.prompt
    const primaryCompletionCost = (primaryResponse.usage.completion_tokens / 1000000) * model.pricing.completion
    const primaryTestCost = primaryPromptCost + primaryCompletionCost

    // Calculate evaluation cost using the selected evaluation model's pricing
    const evaluationPromptCost = (evaluationTokens.promptTokens / 1000000) * evaluationModel.pricing.prompt
    const evaluationCompletionCost = (evaluationTokens.completionTokens / 1000000) * evaluationModel.pricing.completion
    const evaluationCost = evaluationPromptCost + evaluationCompletionCost

    return primaryTestCost + evaluationCost
  }

  /**
   * Calculate the overall score from individual metrics using weighted average
   */
  static calculateOverallScore(metrics: Omit<SuccessMetrics, 'overallScore' | 'explanation'>): number {
    // Weighted scoring: Task completion and instruction adherence are most important
    const weights = {
      taskCompletion: 0.3,
      instructionAdherence: 0.3,
      coherence: 0.25,
      efficiency: 0.15
    }

    const weightedScore = 
      (metrics.taskCompletionScore * weights.taskCompletion) +
      (metrics.instructionAdherenceScore * weights.instructionAdherence) +
      (metrics.coherenceScore * weights.coherence) +
      (metrics.efficiencyScore * weights.efficiency)

    return Math.round(weightedScore)
  }
}