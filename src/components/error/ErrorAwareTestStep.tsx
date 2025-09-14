'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { validatePrompt, getInputClasses, getHelperTextClasses } from '@/lib/validation'
import { Play, ArrowLeft } from 'phosphor-react'
import ErrorBoundary from './ErrorBoundary'
import ApiErrorDisplay from './ApiErrorDisplay'
import { AppError, ErrorRecoveryManager } from '@/lib/errorHandling'

interface ErrorAwareTestStepProps {
  onNext?: () => void
  onBack?: () => void
}

/**
 * Enhanced TestStep component with comprehensive error handling and recovery
 */
export default function ErrorAwareTestStep({ onBack }: ErrorAwareTestStepProps) {
  const { 
    currentTest, 
    setPrompt, 
    setCurrentStep, 
    runEvaluation,
    isLoading,
    error,
    clearError
  } = useAppStore()
  
  const [prompt, setPromptLocal] = useState(currentTest.prompt)
  const [evaluationError, setEvaluationError] = useState<AppError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  // Validate prompt
  const validation = validatePrompt(prompt)

  // Update store when prompt changes
  useEffect(() => {
    setPrompt(prompt)
  }, [prompt, setPrompt])

  // Handle evaluation errors from store
  useEffect(() => {
    if (currentTest.error) {
      setEvaluationError({
        type: 'api',
        message: currentTest.error,
        retryable: true,
        timestamp: Date.now()
      })
    } else {
      setEvaluationError(null)
    }
  }, [currentTest.error])

  // Restore user input if there was a previous error
  useEffect(() => {
    const operationId = 'test_evaluation'
    const recoveredData = ErrorRecoveryManager.restoreUserInput(operationId)
    
    if (recoveredData && recoveredData.prompt && !prompt) {
      setPromptLocal(recoveredData.prompt)
    }
  }, [])

  const handleRunEvaluation = async () => {
    if (!validation.isValid || isLoading) return

    const operationId = 'test_evaluation'
    
    try {
      // Clear any previous errors
      clearError()
      setEvaluationError(null)
      
      // Preserve user input before attempting evaluation
      ErrorRecoveryManager.preserveUserInput(operationId, {
        prompt,
        instructions: currentTest.instructions,
        model: currentTest.model,
        timestamp: Date.now()
      })

      await runEvaluation()
      
      // Clear recovery state on success
      ErrorRecoveryManager.clearRecoveryState(operationId)
      setRetryCount(0)
    } catch (error) {
      console.error('Evaluation failed:', error)
      
      // Update retry count
      ErrorRecoveryManager.updateRetryCount(operationId)
      setRetryCount(prev => prev + 1)
      
      // The error will be handled by the store and reflected in currentTest.error
    }
  }

  const handleRetryEvaluation = async () => {
    await handleRunEvaluation()
  }

  const handleBack = () => {
    // Clear any errors when navigating back
    clearError()
    setEvaluationError(null)
    setCurrentStep(1) // Back to instructions step
    onBack?.()
  }

  const handleErrorDismiss = () => {
    clearError()
    setEvaluationError(null)
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Test step error boundary:', error)
        setEvaluationError(error)
      }}
      resetKeys={[currentTest.model?.id, currentTest.instructions]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Test Your Instructions</h3>
          <p className="text-muted-foreground text-sm">
            Enter a test prompt to evaluate how well your system instructions work.
          </p>
        </div>

        {/* Error Display */}
        {(evaluationError || error) && (
          <ApiErrorDisplay
            error={evaluationError || (error ? {
              type: 'api',
              message: error,
              retryable: true,
              timestamp: Date.now()
            } : null)}
            onRetry={handleRetryEvaluation}
            onDismiss={handleErrorDismiss}
            autoRetry={retryCount < 2} // Auto-retry for first 2 attempts
            autoRetryDelay={Math.min(5000 * Math.pow(2, retryCount), 30000)} // Exponential backoff
            preserveInput={true}
          />
        )}

        {/* Selected Model Display */}
        {currentTest.model && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{currentTest.model.name}</p>
                <p className="text-xs text-muted-foreground">{currentTest.model.provider}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Context Length</p>
                <p className="text-sm font-medium">{currentTest.model.contextLength.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">System Instructions Preview</label>
          <div className="bg-muted/30 p-3 rounded-lg border">
            <p className="text-sm font-mono text-muted-foreground leading-relaxed">
              {currentTest.instructions || 'No instructions provided'}
            </p>
          </div>
        </div>

        {/* Test Prompt Input */}
        <div className="space-y-2">
          <label htmlFor="prompt" className="block text-sm font-medium">
            Test Prompt *
          </label>
          <div className="relative">
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPromptLocal(e.target.value)}
              placeholder="Write a short story about..."
              className={`${getInputClasses(validation.status)} min-h-[120px]`}
              rows={5}
              disabled={isLoading}
            />
            
            {/* Character counter */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              {prompt.length}/2000
            </div>
          </div>
          
          {/* Helper text */}
          <p className={getHelperTextClasses(validation.status)}>
            {validation.message}
          </p>
        </div>

        {/* Test Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
            🧪 What happens when you run the test:
          </h4>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Your prompt will be sent to {currentTest.model?.name} with your system instructions</li>
            <li>The response will be evaluated by GPT-4 for quality and instruction adherence</li>
            <li>You&apos;ll receive detailed metrics and an overall success score</li>
            <li>Results will be saved to your session history for comparison</li>
          </ol>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            Back to Instructions
          </button>
          
          <button
            onClick={handleRunEvaluation}
            disabled={!validation.isValid || isLoading}
            className={`
              flex items-center gap-2 px-6 py-2 text-sm rounded-lg font-medium transition-colors
              ${validation.isValid && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Running Evaluation...
              </>
            ) : (
              <>
                <Play size={16} weight="fill" />
                Run Evaluation
                {retryCount > 0 && (
                  <span className="text-xs opacity-75">
                    (Retry {retryCount})
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* Loading State with Progress */}
        {isLoading && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium">Running evaluation...</p>
                <p className="text-xs text-muted-foreground">
                  This may take 10-30 seconds depending on the model and prompt complexity.
                  {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-3 w-full bg-muted rounded-full h-1">
              <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Recovery Information */}
        {retryCount > 0 && !isLoading && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💾 Your input has been preserved. You can safely retry the evaluation or navigate to other steps.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}