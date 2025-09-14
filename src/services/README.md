# Evaluation Engine

The EvaluationEngine is the core service responsible for executing dual-model AI evaluations in Instruct-Lab.

## Overview

The evaluation process consists of two phases:
1. **Primary Test**: Execute the user's system instructions and prompt using their selected model
2. **Evaluation**: Use GPT-4 to score the primary response across multiple metrics

## Usage

```typescript
import { EvaluationEngine, TestParams } from '@/services'

const testParams: TestParams = {
  apiKey: 'sk-or-your-openrouter-key',
  model: selectedModel,
  systemInstructions: 'You are a helpful assistant...',
  userPrompt: 'What is artificial intelligence?',
  temperature: 0.7,
  maxTokens: 1000
}

const result = await EvaluationEngine.executeEvaluation(testParams)
```

## Result Structure

```typescript
interface TestResult {
  response: string           // The primary model's response
  metrics: SuccessMetrics   // Evaluation scores (0-100)
  tokenUsage: TokenStats    // Token consumption details
  executionTime: number     // Total time in milliseconds
  cost: number             // Total cost in USD
}

interface SuccessMetrics {
  overallScore: number              // Weighted average (0-100)
  coherenceScore: number           // Logical clarity (0-100)
  taskCompletionScore: number      // Request fulfillment (0-100)
  instructionAdherenceScore: number // Following system instructions (0-100)
  efficiencyScore: number          // Conciseness and relevance (0-100)
  explanation: string              // Evaluation rationale
}
```

## Evaluation Criteria

The evaluation engine uses a structured prompt to ensure consistent scoring:

- **Coherence (25% weight)**: How logical, clear, and well-structured is the response?
- **Task Completion (30% weight)**: How completely does the response address the user's request?
- **Instruction Adherence (30% weight)**: How well does the response follow the system instructions?
- **Efficiency (15% weight)**: How concise and relevant is the response without unnecessary content?

## Error Handling

The engine includes comprehensive error handling:

- **API Errors**: Network failures, authentication issues, rate limiting
- **Response Parsing**: Malformed evaluation responses fall back to default scores
- **Validation**: Input parameter validation and response structure verification

## Cost Calculation

Costs are calculated for both API calls:
- Primary test using the selected model's pricing
- Evaluation using GPT-4 Turbo pricing ($0.01/1K prompt, $0.03/1K completion)

## Integration with Store

The evaluation engine integrates with the Zustand store through the `runEvaluation` action:

```typescript
// In store
const result = await EvaluationEngine.executeEvaluation(testParams)
completeTest(result.metrics, result.response, result.tokenUsage, result.executionTime, result.cost)
```

## Testing

The engine includes comprehensive unit and integration tests:

```bash
npm run test:run -- src/services/__tests__/
```

Tests cover:
- Complete evaluation workflow
- Error handling scenarios
- Response parsing edge cases
- Cost calculation accuracy
- Integration with store patterns