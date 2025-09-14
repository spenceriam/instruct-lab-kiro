'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { validatePrompt, getInputClasses, getHelperTextClasses } from '@/lib/validation'
import { Play, ArrowLeft } from 'phosphor-react'

interface TestStepProps {
  onNext?: () => void
  onBack?: () => void
}

export default function TestStep({ onBack }: TestStepProps) {
  const { 
    currentTest, 
    setPrompt, 
    setCurrentStep, 
    runEvaluation,
    isLoading 
  } = useAppStore()
  
  const [prompt, setPromptLocal] = useState(currentTest.prompt)
  
  // Validate prompt
  const validation = validatePrompt(prompt)

  // Update store when prompt changes
  useEffect(() => {
    setPrompt(prompt)
  }, [prompt, setPrompt])

  const handleRunEvaluation = async () => {
    if (validation.isValid && !isLoading) {
      await runEvaluation()
      // The store will automatically update the step when evaluation completes
    }
  }

  const handleBack = () => {
    setCurrentStep(1) // Back to instructions step
    onBack?.()
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Test Your Instructions</h3>
        <p className="text-muted-foreground text-sm">
          Enter a test prompt to evaluate how well your system instructions work.
        </p>
      </div>

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

      {/* Run Evaluation Button */}
      <div className="flex justify-center pt-4 border-t border-border">
        <button
          onClick={handleRunEvaluation}
          disabled={!validation.isValid || isLoading}
          className={`
            flex items-center gap-2 px-8 py-3 text-sm rounded-lg font-medium transition-colors min-h-[44px]
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
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-sm font-medium">Running evaluation...</p>
              <p className="text-xs text-muted-foreground">
                This may take 10-30 seconds depending on the model and prompt complexity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}