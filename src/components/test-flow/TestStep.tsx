'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { validatePrompt, getInputClasses, getHelperTextClasses } from '@/lib/validation'
import { Play, ArrowLeft, CaretDown, CaretRight, Clock } from 'phosphor-react'

interface TestStepProps {
  onNext?: () => void
  onBack?: () => void
}

export default function TestStep({ onBack }: TestStepProps) {
  const { 
    currentTest, 
    settings,
    setPrompt, 
    setCurrentStep, 
    runEvaluation,
    isLoading 
  } = useAppStore()
  
  const [prompt, setPromptLocal] = useState(currentTest.prompt)
  const [showInstructions, setShowInstructions] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  
  // Validate prompt
  const validation = validatePrompt(prompt)

  // Update store when prompt changes
  useEffect(() => {
    setPrompt(prompt)
  }, [prompt, setPrompt])

  // Timer for elapsed time during evaluation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isLoading && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100) // Update every 100ms for smooth display
    } else if (!isLoading) {
      if (interval) {
        clearInterval(interval)
      }
      // Reset timer when evaluation completes
      if (startTime) {
        setStartTime(null)
        setElapsedTime(0)
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isLoading, startTime])

  const handleRunEvaluation = async () => {
    if (validation.isValid && !isLoading) {
      setStartTime(Date.now())
      setElapsedTime(0)
      await runEvaluation()
      // The store will automatically update the step when evaluation completes
    }
  }

  const handleBack = () => {
    setCurrentStep(1) // Back to instructions step
    onBack?.()
  }

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const milliseconds = Math.floor((ms % 1000) / 100)
    return `${seconds}.${milliseconds}s`
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
              <p className="text-sm font-medium">{currentTest.model?.name || 'Unknown Model'}</p>
              <p className="text-xs text-muted-foreground">{currentTest.model?.provider || 'Unknown Provider'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Context Length</p>
              <p className="text-sm font-medium">{(currentTest.model.contextLength || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Preview (collapsible) */}
      <div className="bg-muted/50 rounded-lg p-4">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-between w-full text-left"
        >
          <label className="text-sm font-medium cursor-pointer">System Instructions Preview</label>
          {showInstructions ? (
            <CaretDown size={16} className="text-muted-foreground" />
          ) : (
            <CaretRight size={16} className="text-muted-foreground" />
          )}
        </button>
        {showInstructions && (
          <div className="mt-3 bg-background rounded border p-3 max-h-32 overflow-y-auto">
            <p className="text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap">
              {currentTest.instructions || 'No instructions provided'}
            </p>
          </div>
        )}
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
            onKeyDown={(e) => {
              // Prevent any keyboard shortcuts except basic text editing
              if (e.key === 'Escape' || e.key === 'F1' || e.key === 'F2' || e.key === 'F3' || 
                  e.key === 'F4' || e.key === 'F5' || e.key === 'F6' || e.key === 'F7' || 
                  e.key === 'F8' || e.key === 'F9' || e.key === 'F10' || e.key === 'F11' || e.key === 'F12') {
                e.preventDefault()
                e.stopPropagation()
              }
              // Allow only basic text editing shortcuts
              const isBasicShortcut = (
                (e.ctrlKey || e.metaKey) && (
                  e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x' || 
                  e.key === 'z' || e.key === 'y' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
                )
              )
              if (!isBasicShortcut && (e.ctrlKey || e.metaKey || e.altKey)) {
                // Block any other keyboard shortcuts
                e.preventDefault()
                e.stopPropagation()
              }
            }}
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
          <li>The response will be evaluated by {settings.evaluationModel?.name || 'the evaluation model'} for quality and instruction adherence</li>
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
              Running Evaluation... {elapsedTime > 0 && `(${formatElapsedTime(elapsedTime)})`}
            </>
          ) : (
            <>
              <Play size={16} weight="fill" />
              Run Evaluation
            </>
          )}
        </button>
      </div>

      {/* Elapsed Time Display */}
      {isLoading && elapsedTime > 0 && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Elapsed: {formatElapsedTime(elapsedTime)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Evaluation typically takes 10-30 seconds depending on model and prompt complexity
          </p>
        </div>
      )}

    </div>
  )
}