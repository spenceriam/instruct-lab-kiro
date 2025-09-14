# Product Requirements Document: Instruct-Lab
## AI System Instruction Testing & Optimization Platform

**Version:** 1.0.0  
**Date:** September 2025  
**Category:** Productivity & Workflow Tools (Kiro Hackathon)  
**Author:** Senior Product Manager  
**Target Implementation:** Kiro IDE with Vibe/Agentic Coding

---

## Executive Summary

Instruct-Lab is a nano SaaS platform that enables developers and AI practitioners to test, evaluate, and optimize their system instructions across multiple AI models using OpenRouter's unified API. The platform simulates task execution probability, providing quantitative metrics on instruction effectiveness without vendor lock-in.

### Key Value Propositions
- **Model-Agnostic Testing**: Test instructions across any OpenRouter-supported model
- **Quantitative Evaluation**: Get success probability scores with detailed metrics
- **Rapid Iteration**: Test, revise, and retest instructions in real-time
- **Cost Transparency**: Track token usage and execution time for optimization
- **Privacy-First**: Browser-based storage with session-only persistence

---

## Technical Architecture

### System Overview
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Layer      │────▶│   OpenRouter    │
│   (React/Next)  │     │   (Next.js API)  │     │   Integration   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser Storage│     │  Session Manager │     │  Model Registry │
│  (SessionStore) │     │   (Ephemeral)    │     │   (API Cache)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui + MagicUI
- **Icons**: Phosphor Icons
- **Styling**: Tailwind CSS (minimal, clean aesthetic)
- **State Management**: Zustand with session storage persistence
- **API Integration**: OpenRouter SDK/REST API
- **Analytics**: Custom event tracking (privacy-preserving)
- **Deployment**: Vercel Edge Functions

### Core Components

#### 1. Model Selection Service
```typescript
interface ModelSelectionService {
  searchModels(query: string): Promise<Model[]>;
  getPopularModels(): Model[];
  getPriorityModels(): Model[]; // OpenAI, Anthropic, Gemini
  validateApiKey(key: string, model: Model): Promise<boolean>;
  getModelCapabilities(modelId: string): ModelCapabilities;
}
```

#### 2. Instruction Evaluation Engine
```typescript
interface EvaluationEngine {
  // Primary evaluation using selected model
  executeTest(params: TestParams): Promise<TestResult>;
  
  // Secondary evaluation for success probability
  evaluateSuccess(params: EvaluationParams): Promise<SuccessMetrics>;
  
  // Metrics calculation
  calculateMetrics(response: AIResponse): Metrics;
}

interface TestParams {
  apiKey: string;
  model: Model;
  systemInstructions: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface SuccessMetrics {
  overallScore: number; // 0-100%
  coherenceScore: number;
  taskCompletionScore: number;
  instructionAdherenceScore: number;
  efficiencyScore: number;
  tokenUsage: TokenStats;
  executionTime: number;
}
```

#### 3. Session Management
```typescript
interface SessionManager {
  createSession(): string;
  storeTestRun(sessionId: string, run: TestRun): void;
  getSessionHistory(sessionId: string): TestRun[];
  clearSession(sessionId: string): void;
  exportSession(sessionId: string): ExportData;
  scheduleCleanup(sessionId: string, ttl: number): void;
}
```

#### 4. Export Service
```typescript
interface ExportService {
  exportInstructions(instructions: string, format: 'json' | 'md' | 'txt'): Blob;
  exportResults(results: TestResult[], format: 'json' | 'csv' | 'pdf'): Blob;
  generateReport(session: SessionData): Report;
}
```

---

## User Interface Specifications

### Design Philosophy
- **Minimalist**: Clean, distraction-free interface similar to OpenUI
- **Functional**: Every element serves a purpose
- **Accessible**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first design approach

### Color Palette
```css
--background: #ffffff;
--foreground: #0a0a0a;
--muted: #f4f4f5;
--muted-foreground: #71717a;
--border: #e4e4e7;
--primary: #18181b;
--primary-foreground: #fafafa;
--accent: #f4f4f5;
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
```

### Page Structure

#### 1. Landing Page (/)
```jsx
<Layout>
  <Header>
    <Logo /> // Simple text: "Instruct-Lab"
    <Navigation>
      <Button variant="ghost">Documentation</Button>
      <Button variant="ghost">Reset Session</Button>
    </Navigation>
  </Header>
  
  <Main>
    <Hero>
      <h1>Test Your AI System Instructions</h1>
      <p>Evaluate instruction effectiveness across multiple models</p>
      <Button onClick={startTesting}>Start Testing</Button>
    </Hero>
  </Main>
</Layout>
```

#### 2. Testing Interface (/test)
```jsx
<TestLayout>
  <StepIndicator currentStep={step} />
  
  <TestContainer>
    {/* Step 1: API Configuration */}
    <ApiSetup>
      <Input 
        type="password" 
        placeholder="OpenRouter API Key"
        value={apiKey}
      />
      <ModelSelector>
        <SearchInput placeholder="Search models..." />
        <ModelGrid>
          {/* Priority models shown first */}
          <ModelCard model="gpt-4" />
          <ModelCard model="claude-3" />
          <ModelCard model="gemini-pro" />
        </ModelGrid>
      </ModelSelector>
    </ApiSetup>
    
    {/* Step 2: Instructions Input */}
    <InstructionsInput>
      <Textarea 
        placeholder="Enter your system instructions..."
        rows={10}
        value={instructions}
      />
      <CharacterCount>{instructions.length} characters</CharacterCount>
    </InstructionsInput>
    
    {/* Step 3: Test Prompt */}
    <TestPromptInput>
      <Textarea 
        placeholder="Enter test prompt to evaluate..."
        rows={5}
        value={testPrompt}
      />
      <Button onClick={runTest}>Run Evaluation</Button>
    </TestPromptInput>
  </TestContainer>
</TestLayout>
```

#### 3. Results Display (/test/results)
```jsx
<ResultsLayout>
  <ScoreCard>
    <CircularProgress value={overallScore} />
    <h2>{overallScore}% Success Probability</h2>
  </ScoreCard>
  
  <MetricsGrid>
    <MetricCard 
      label="Coherence"
      value={coherenceScore}
      icon={<CheckCircle />}
    />
    <MetricCard 
      label="Task Completion"
      value={taskCompletionScore}
      icon={<Target />}
    />
    <MetricCard 
      label="Instruction Adherence"
      value={adherenceScore}
      icon={<FileText />}
    />
    <MetricCard 
      label="Efficiency"
      value={efficiencyScore}
      icon={<Lightning />}
    />
  </MetricsGrid>
  
  <TokenStats>
    <Stat label="Tokens Used" value={tokenCount} />
    <Stat label="Execution Time" value={`${executionTime}ms`} />
    <Stat label="Cost Estimate" value={`$${cost}`} />
  </TokenStats>
  
  <Actions>
    <Button onClick={reviseInstructions}>Revise Instructions</Button>
    <Button onClick={exportResults}>Export Results</Button>
    <Button variant="outline" onClick={newTest}>New Test</Button>
  </Actions>
  
  {sessionHistory.length > 0 && (
    <SessionHistory>
      <h3>Session History</h3>
      <HistoryList>
        {sessionHistory.map(run => (
          <HistoryItem key={run.id}>
            <span>{run.model}</span>
            <span>{run.score}%</span>
            <span>{run.timestamp}</span>
          </HistoryItem>
        ))}
      </HistoryList>
      <Button variant="ghost" onClick={clearHistory}>Clear History</Button>
    </SessionHistory>
  )}
</ResultsLayout>
```

---

## API Specifications

### OpenRouter Integration

#### 1. Model Search Endpoint
```typescript
GET /api/models/search
Query Parameters:
  - query: string
  - limit?: number (default: 20)
  - category?: 'chat' | 'completion' | 'all'

Response:
{
  models: [
    {
      id: string,
      name: string,
      provider: string,
      contextLength: number,
      pricing: {
        prompt: number,
        completion: number
      }
    }
  ]
}
```

#### 2. Evaluation Endpoint
```typescript
POST /api/evaluate
Body:
{
  apiKey: string,
  model: string,
  systemInstructions: string,
  userPrompt: string,
  evaluationModel?: string // Optional: specific model for evaluation
}

Response:
{
  success: boolean,
  result: {
    primaryResponse: {
      content: string,
      tokens: number,
      executionTime: number
    },
    evaluation: {
      overallScore: number,
      metrics: {
        coherence: number,
        taskCompletion: number,
        instructionAdherence: number,
        efficiency: number
      },
      explanation: string
    },
    cost: {
      primary: number,
      evaluation: number,
      total: number
    }
  }
}
```

#### 3. Export Endpoint
```typescript
POST /api/export
Body:
{
  sessionId: string,
  format: 'json' | 'csv' | 'pdf',
  includeInstructions: boolean,
  includeResults: boolean
}

Response:
{
  downloadUrl: string,
  expiresAt: number
}
```

---

## Evaluation Logic Implementation

### Success Probability Calculation

```typescript
class EvaluationService {
  async evaluateSuccess(
    response: string,
    instructions: string,
    prompt: string,
    evaluationModel: string = 'gpt-4'
  ): Promise<SuccessMetrics> {
    
    // Construct evaluation prompt
    const evaluationPrompt = `
      You are an expert AI instruction evaluator. Analyze the following:
      
      SYSTEM INSTRUCTIONS:
      ${instructions}
      
      USER PROMPT:
      ${prompt}
      
      AI RESPONSE:
      ${response}
      
      Evaluate the response on these criteria (0-100 scale):
      1. Coherence: Is the response logically structured and clear?
      2. Task Completion: Does it fully address the user's prompt?
      3. Instruction Adherence: Does it follow the system instructions?
      4. Efficiency: Is it concise while being complete?
      
      Return a JSON object with scores and brief explanations.
    `;
    
    const evaluation = await this.callOpenRouter(
      evaluationModel,
      evaluationPrompt
    );
    
    return this.parseEvaluation(evaluation);
  }
  
  calculateOverallScore(metrics: Metrics): number {
    const weights = {
      coherence: 0.2,
      taskCompletion: 0.35,
      instructionAdherence: 0.35,
      efficiency: 0.1
    };
    
    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (metrics[key] * weight);
    }, 0);
  }
}
```

---

## Database Schema (Session Storage)

```typescript
// Using browser sessionStorage with Zustand
interface SessionStore {
  sessionId: string;
  apiKey: string; // Encrypted in memory only
  currentTest: {
    model: Model;
    instructions: string;
    prompt: string;
    status: 'idle' | 'testing' | 'complete' | 'error';
  };
  history: TestRun[];
  settings: {
    temperature: number;
    maxTokens: number;
    evaluationModel: string;
  };
}

interface TestRun {
  id: string;
  timestamp: number;
  model: string;
  instructions: string;
  prompt: string;
  response: string;
  metrics: SuccessMetrics;
  tokenUsage: TokenStats;
  executionTime: number;
  cost: number;
}
```

---

## Implementation Phases for Kiro

### Phase 1: Core Setup (30 minutes)
1. Initialize Next.js project with TypeScript
2. Install dependencies (shadcn/ui, zustand, phosphor-react)
3. Set up project structure and routing
4. Configure Tailwind with minimal theme
5. Create base layouts and components

### Phase 2: OpenRouter Integration (45 minutes)
1. Implement OpenRouter API client
2. Create model search and selection UI
3. Build API key validation
4. Set up request/response handling
5. Implement error handling and retries

### Phase 3: Evaluation Engine (60 minutes)
1. Build instruction input interface
2. Create prompt testing flow
3. Implement dual-model evaluation system
4. Calculate success metrics
5. Build results processing pipeline

### Phase 4: UI Implementation (45 minutes)
1. Create step-by-step wizard flow
2. Build results visualization
3. Implement session history display
4. Add export functionality
5. Create responsive layouts

### Phase 5: Polish & Testing (30 minutes)
1. Add loading states and animations
2. Implement error boundaries
3. Create unit tests for core logic
4. Add integration tests for API
5. Performance optimization

---

## Success Criteria for Hackathon

### Must Have (MVP)
- ✅ Functional OpenRouter integration
- ✅ Model search and selection
- ✅ System instruction input
- ✅ Test prompt execution
- ✅ Success probability calculation
- ✅ Token usage tracking
- ✅ Session-based storage
- ✅ Export functionality
- ✅ Clean, minimal UI

### Nice to Have
- Comparison mode (multiple instructions)
- Prompt templates library
- Advanced metrics visualization
- Cost optimization suggestions
- Batch testing capability

---

## Testing Strategy

### Unit Tests
```typescript
describe('EvaluationService', () => {
  test('calculates success probability correctly', async () => {
    const metrics = {
      coherence: 85,
      taskCompletion: 90,
      instructionAdherence: 88,
      efficiency: 75
    };
    
    const score = service.calculateOverallScore(metrics);
    expect(score).toBe(86.3);
  });
  
  test('handles API errors gracefully', async () => {
    const result = await service.evaluateWithRetry(params);
    expect(result).toHaveProperty('error');
  });
});
```

### Integration Tests
```typescript
describe('OpenRouter Integration', () => {
  test('searches models successfully', async () => {
    const models = await api.searchModels('gpt');
    expect(models).toContainEqual(
      expect.objectContaining({ provider: 'openai' })
    );
  });
  
  test('executes evaluation pipeline', async () => {
    const result = await api.runEvaluation(testParams);
    expect(result.metrics).toBeDefined();
    expect(result.tokenUsage).toBeGreaterThan(0);
  });
});
```

---

## Deployment Configuration

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=https://instruct-lab.vercel.app
OPENROUTER_API_URL=https://openrouter.ai/api/v1
ENCRYPTION_KEY=[generated-key]
SESSION_TTL=3600000 # 1 hour
MAX_SESSION_STORAGE=10485760 # 10MB
```

### Vercel Configuration
```json
{
  "functions": {
    "api/evaluate": {
      "maxDuration": 30
    },
    "api/models/*": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## Security Considerations

1. **API Key Handling**
   - Never store API keys in localStorage
   - Encrypt in sessionStorage
   - Clear on session end
   - Use HTTPS only

2. **Rate Limiting**
   - Implement per-session limits
   - Add cooldown periods
   - Monitor for abuse

3. **Data Privacy**
   - No server-side storage of user data
   - Session data expires automatically
   - Export data directly to user

---

## Performance Optimization

1. **Caching Strategy**
   - Cache model list for 1 hour
   - Debounce search queries
   - Lazy load UI components

2. **Bundle Optimization**
   - Code split by route
   - Tree shake unused icons
   - Optimize images with next/image

3. **API Optimization**
   - Batch requests where possible
   - Implement request queuing
   - Add response compression

---

## Monitoring & Analytics

### Key Metrics to Track
- Average success scores by model
- Most tested instruction patterns
- Token usage patterns
- Error rates and types
- User session duration

### Implementation
```typescript
const analytics = {
  trackEvent(event: string, properties?: Record<string, any>) {
    // Privacy-preserving analytics
    // No PII collected
    console.log('Event:', event, properties);
  },
  
  trackError(error: Error, context?: Record<string, any>) {
    console.error('Error:', error, context);
  }
};
```

---

## Documentation for Kiro Implementation

### Kiro Hooks Configuration (.kiro/hooks/)
```yaml
# pre-commit.yaml
name: "Run Tests"
trigger: "pre-commit"
command: "npm test"

# post-generate.yaml  
name: "Format Code"
trigger: "post-generate"
command: "npm run format"
```

### Kiro Specs (.kiro/specs/)
```yaml
# evaluation-engine.spec.yaml
name: "Evaluation Engine"
description: "Core evaluation logic for instruction testing"
requirements:
  - Dual-model evaluation system
  - Metric calculation with weights
  - Error handling with retries
  - Token tracking
validation:
  - Unit tests pass
  - Integration with OpenRouter works
  - Metrics are 0-100 range
```

---

## Submission Requirements

### Video Script (3 minutes)
1. **Introduction** (30s)
   - Problem: Developers struggle to optimize AI system instructions
   - Solution: Instruct-Lab provides quantitative testing

2. **Kiro Usage** (90s)
   - Show spec-to-code generation
   - Demonstrate vibe coding for UI
   - Highlight agent hooks for testing

3. **Demo** (60s)
   - Test instructions across models
   - Show success probability
   - Export and iterate

4. **Impact** (30s)
   - Saves development time
   - Improves AI reliability
   - Model-agnostic approach

### Repository Structure
```
instruct-lab/
├── .kiro/
│   ├── specs/
│   ├── hooks/
│   └── steering/
├── src/
│   ├── app/
│   ├── components/
│   ├── services/
│   └── lib/
├── tests/
├── public/
├── README.md
├── LICENSE (MIT)
└── package.json
```

---

## Conclusion

Instruct-Lab represents a critical productivity tool for the AI development ecosystem. By providing quantitative evaluation of system instructions, it enables developers to optimize their AI interactions scientifically rather than through trial and error. The implementation via Kiro demonstrates the power of spec-driven development and vibe coding to rapidly build production-ready applications.

### Key Differentiators
- **Model Agnostic**: Works with any OpenRouter model
- **Privacy First**: No data retention, session-only storage
- **Quantitative**: Objective success metrics
- **Developer Friendly**: Clean UI, fast iteration
- **Cost Transparent**: Clear token and cost tracking

This PRD provides Kiro with all necessary context to implement Instruct-Lab successfully for the hackathon submission.