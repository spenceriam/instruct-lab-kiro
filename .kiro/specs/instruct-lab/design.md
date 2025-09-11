# Design Document

## Overview

Instruct-Lab is a Next.js 14 single-page application that provides AI system instruction testing through a modal-based interface. The application uses OpenRouter's API for model access and implements a dual-model evaluation system where user instructions are tested with their selected model, then evaluated for effectiveness using GPT-4. All data is stored locally in browser session storage with encryption for privacy.

## Architecture

### System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Layer      │────▶│   OpenRouter    │
│   (Next.js)     │     │   (Next.js API)  │     │   Integration   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Session Storage│     │  Zustand Store   │     │  Model Registry │
│  (Encrypted)    │     │   (Runtime)      │     │   (API Cache)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Technology Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **UI Components**: shadcn/ui components with Tailwind CSS
- **Icons**: Phosphor React icons
- **State Management**: Zustand with session storage persistence
- **API Integration**: OpenRouter REST API with fetch
- **Encryption**: Web Crypto API for API key security
- **Styling**: Tailwind CSS with custom CSS variables

## Components and Interfaces

### Core Components

#### 1. Application Shell
```typescript
interface AppShell {
  header: Header;
  main: MainContent;
  footer: Footer;
  modals: Modal[];
}

interface Header {
  logo: string;
  navigation: NavigationItem[];
}

interface MainContent {
  hero: HeroSection;
  features: FeatureGrid;
  history: HistorySection;
}
```

#### 2. Modal System
```typescript
interface ModalManager {
  activeModal: string | null;
  openModal(id: string): void;
  closeModal(id: string): void;
  closeOnOverlay: boolean;
}

interface TestFlowModal {
  currentStep: 'setup' | 'instructions' | 'test' | 'results';
  stepData: StepData;
  navigation: StepNavigation;
}
```

#### 3. OpenRouter Integration
```typescript
interface OpenRouterService {
  searchModels(query: string): Promise<Model[]>;
  validateApiKey(key: string): Promise<boolean>;
  executeTest(params: TestParams): Promise<TestResponse>;
  evaluateResponse(params: EvaluationParams): Promise<EvaluationResult>;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

interface TestParams {
  apiKey: string;
  model: string;
  systemInstructions: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface EvaluationParams {
  response: string;
  instructions: string;
  prompt: string;
  evaluationModel: string;
}
```

#### 4. State Management
```typescript
interface AppStore {
  // Session data
  sessionId: string;
  apiKey: string | null;
  
  // Current test state
  currentTest: {
    model: Model | null;
    instructions: string;
    prompt: string;
    status: 'idle' | 'testing' | 'evaluating' | 'complete' | 'error';
    results: TestResult | null;
  };
  
  // History
  testHistory: TestRun[];
  
  // UI state
  activeModal: string | null;
  currentStep: string;
  
  // Actions
  setApiKey(key: string): void;
  selectModel(model: Model): void;
  updateInstructions(text: string): void;
  updatePrompt(text: string): void;
  runEvaluation(): Promise<void>;
  addToHistory(result: TestRun): void;
  clearHistory(): void;
}
```

#### 5. Evaluation Engine
```typescript
interface EvaluationEngine {
  executeTest(params: TestParams): Promise<TestResponse>;
  evaluateSuccess(params: EvaluationParams): Promise<SuccessMetrics>;
  calculateOverallScore(metrics: IndividualMetrics): number;
  formatResults(response: TestResponse, evaluation: SuccessMetrics): TestResult;
}

interface SuccessMetrics {
  overallScore: number; // 0-100
  coherenceScore: number; // 0-100
  taskCompletionScore: number; // 0-100
  instructionAdherenceScore: number; // 0-100
  efficiencyScore: number; // 0-100
  explanation: string;
  tokenUsage: TokenStats;
  executionTime: number;
  cost: CostBreakdown;
}

interface TokenStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface CostBreakdown {
  primaryTest: number;
  evaluation: number;
  total: number;
}
```

## Data Models

### Session Storage Schema
```typescript
interface SessionData {
  sessionId: string;
  encryptedApiKey?: string;
  testHistory: TestRun[];
  settings: UserSettings;
  createdAt: number;
  expiresAt: number;
}

interface TestRun {
  id: string;
  timestamp: number;
  model: string;
  modelProvider: string;
  instructions: string;
  prompt: string;
  response: string;
  metrics: SuccessMetrics;
  tokenUsage: TokenStats;
  executionTime: number;
  cost: number;
}

interface UserSettings {
  temperature: number;
  maxTokens: number;
  evaluationModel: string;
  autoSave: boolean;
}
```

### API Response Models
```typescript
interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

interface Choice {
  index: number;
  message: Message;
  finish_reason: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
```

## Error Handling

### Error Types and Recovery
```typescript
interface ErrorHandler {
  handleApiError(error: ApiError): ErrorResponse;
  handleNetworkError(error: NetworkError): ErrorResponse;
  handleValidationError(error: ValidationError): ErrorResponse;
  retryWithBackoff(operation: () => Promise<any>, maxRetries: number): Promise<any>;
}

interface ErrorResponse {
  type: 'api' | 'network' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
  retryAction?: () => void;
}

// Error scenarios and handling:
// 1. Invalid API key -> Show validation error, allow re-entry
// 2. Model search failure -> Show error with retry button
// 3. Evaluation timeout -> Show timeout error, preserve inputs, allow retry
// 4. Network disconnection -> Show network error, queue retry when online
// 5. Rate limiting -> Show rate limit error with backoff timer
```

### Retry Logic
```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// Exponential backoff for API calls
// Preserve user input during retries
// Show progress during retry attempts
// Allow manual retry override
```

## Testing Strategy

### Unit Testing
```typescript
// Test coverage areas:
describe('EvaluationEngine', () => {
  test('calculates overall score correctly with weighted metrics');
  test('handles API response parsing');
  test('validates input parameters');
  test('formats results consistently');
});

describe('SessionManager', () => {
  test('encrypts and decrypts API keys');
  test('manages session expiration');
  test('handles storage quota exceeded');
  test('clears data on session end');
});

describe('OpenRouterService', () => {
  test('searches models with query filtering');
  test('validates API key format and permissions');
  test('handles rate limiting gracefully');
  test('parses model metadata correctly');
});
```

### Integration Testing
```typescript
describe('End-to-End Flow', () => {
  test('complete evaluation workflow from setup to results');
  test('error recovery during evaluation');
  test('session persistence across page reloads');
  test('export functionality with different formats');
});

describe('API Integration', () => {
  test('OpenRouter model search integration');
  test('dual-model evaluation pipeline');
  test('cost calculation accuracy');
  test('token usage tracking');
});
```

### Performance Testing
```typescript
describe('Performance', () => {
  test('application loads within 2 seconds');
  test('model search responds within 1 second');
  test('session storage operations under 100ms');
  test('animation performance at 60fps');
});
```

## Security Considerations

### API Key Security
```typescript
interface SecurityManager {
  encryptApiKey(key: string): Promise<string>;
  decryptApiKey(encrypted: string): Promise<string>;
  validateKeyFormat(key: string): boolean;
  clearSensitiveData(): void;
}

// Security measures:
// 1. API keys encrypted with Web Crypto API
// 2. Keys never stored in localStorage (only sessionStorage)
// 3. Automatic cleanup on session end
// 4. No server-side key storage or logging
// 5. Direct API communication (no proxy)
```

### Data Privacy
```typescript
interface PrivacyManager {
  anonymizeData(data: any): any;
  validateDataRetention(): boolean;
  exportUserData(): ExportData;
  purgeAllData(): void;
}

// Privacy features:
// 1. No server-side data storage
// 2. No tracking or analytics
// 3. Session-only data retention
// 4. User-controlled data export
// 5. Automatic data expiration
```

## Performance Optimization

### Loading Strategy
```typescript
interface PerformanceOptimizer {
  lazyLoadComponents(): void;
  preloadCriticalResources(): void;
  optimizeBundle(): void;
  cacheStaticAssets(): void;
}

// Optimization techniques:
// 1. Code splitting by route and modal
// 2. Lazy loading of non-critical components
// 3. Image optimization with next/image
// 4. Bundle analysis and tree shaking
// 5. Service worker for offline capability
```

### Caching Strategy
```typescript
interface CacheManager {
  cacheModelList(models: Model[], ttl: number): void;
  getCachedModels(): Model[] | null;
  invalidateCache(key: string): void;
  optimizeStorageUsage(): void;
}

// Caching approach:
// 1. Model list cached for 1 hour
// 2. Search results cached per query
// 3. Session data compressed in storage
// 4. Automatic cleanup of expired data
```

## Deployment Configuration

### Environment Setup
```typescript
interface DeploymentConfig {
  environment: 'development' | 'production';
  apiEndpoints: {
    openRouter: string;
  };
  security: {
    encryptionKey: string;
    sessionTTL: number;
  };
  performance: {
    maxStorageSize: number;
    cacheTimeout: number;
  };
}
```

### Vercel Configuration
```json
{
  "functions": {
    "api/models/search": {
      "maxDuration": 10
    },
    "api/evaluate": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## Accessibility Features

### WCAG 2.1 AA Compliance
```typescript
interface AccessibilityManager {
  validateKeyboardNavigation(): boolean;
  checkColorContrast(): boolean;
  validateScreenReaderSupport(): boolean;
  testFocusManagement(): boolean;
}

// Accessibility features:
// 1. Keyboard navigation for all interactive elements
// 2. Screen reader labels and descriptions
// 3. High contrast color scheme
// 4. Focus management in modals
// 5. Error announcements for screen readers
```

### Responsive Design
```css
/* Breakpoint strategy */
@media (max-width: 768px) {
  /* Mobile optimizations */
  .modal { max-width: 95vw; }
  .metrics-grid { grid-template-columns: 1fr; }
  .stats-row { flex-direction: column; }
}

@media (max-width: 480px) {
  /* Small mobile optimizations */
  .hero h1 { font-size: 2rem; }
  .action-buttons { flex-direction: column; }
}
```

## Monitoring and Analytics

### Error Tracking
```typescript
interface ErrorTracker {
  logError(error: Error, context: ErrorContext): void;
  trackPerformance(metric: PerformanceMetric): void;
  reportUsage(event: UsageEvent): void;
}

// Privacy-preserving analytics:
// 1. No personal data collection
// 2. Aggregated usage patterns only
// 3. Client-side error logging
// 4. Performance metrics for optimization
```

This design provides a comprehensive foundation for building the Instruct-Lab application with all the features specified in the PRD while maintaining privacy, security, and performance standards.