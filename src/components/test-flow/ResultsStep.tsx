'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, CurrencyDollar, Hash, ArrowClockwise, Download, Copy, CaretDown, CaretRight } from 'phosphor-react'
import { useAppStore } from '@/lib/store'
import { ExportModal } from '@/components/modals'
import { TestRun } from '@/lib/types'

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  decimals?: number
}

function AnimatedCounter({ value, duration = 1500, suffix = '', decimals = 0 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = value * easeOutCubic
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])

  return (
    <span>
      {displayValue.toFixed(decimals)}{suffix}
    </span>
  )
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
}

function CircularProgress({ value, size = 120, strokeWidth = 8, className = '' }: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 200) // Small delay before starting animation

    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">
          <AnimatedCounter value={value} suffix="%" />
        </span>
        <span className="text-xs text-muted-foreground">Overall</span>
      </div>
    </div>
  )
}

interface MetricBarProps {
  label: string
  value: number
  color?: string
}

function MetricBar({ label, value, color = 'bg-primary' }: MetricBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(value)
    }, 300) // Stagger the bar animations

    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          <AnimatedCounter value={value} suffix="%" />
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-1500 ease-out ${color}`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  decimals?: number
}

function StatCard({ icon, label, value, suffix = '', decimals = 0 }: StatCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-1 sm:space-y-2">
      <div className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground">
        {icon}
        <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
      </div>
      <div className="text-sm sm:text-lg font-semibold text-foreground">
        {typeof value === 'number' ? (
          <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
        ) : (
          <span className="break-words block" title={String(value)}>{value}</span>
        )}
      </div>
    </div>
  )
}

export default function ResultsStep() {
  const { currentTest, setCurrentStep, resetCurrentTest } = useAppStore()
  const { results, response, model, tokenUsage, executionTime, cost } = currentTest
  const [showExportModal, setShowExportModal] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  if (!results || !response || !model) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          No results available. Please run an evaluation first.
        </div>
        <button
          onClick={() => setCurrentStep(2)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to Test
        </button>
      </div>
    )
  }

  const handleNewTest = () => {
    resetCurrentTest()
    setCurrentStep(0)
  }

  const handleRunAgain = () => {
    setCurrentStep(2)
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const handleCopyResults = async () => {
    if (!results || !model || !response) return

    const resultsText = `
Test Results Summary
===================

Model: ${model.name}
Provider: ${model.provider}

Scores:
- Overall Score: ${results.overallScore}/100
- Coherence: ${results.coherenceScore}/100
- Task Completion: ${results.taskCompletionScore}/100
- Instruction Adherence: ${results.instructionAdherenceScore}/100
- Efficiency: ${results.efficiencyScore}/100

System Instructions:
${currentTest.instructions}

Test Prompt:
${currentTest.prompt}

Model Response:
${response}

Evaluation Summary:
${results.explanation}

Performance Metrics:
- Execution Time: ${executionTime ? `${executionTime}ms` : 'N/A'}
- Total Cost: ${cost ? `$${cost.toFixed(4)}` : 'N/A'}
- Tokens Used: ${tokenUsage ? `${tokenUsage.totalTokens}` : 'N/A'}
`.trim()

    try {
      await navigator.clipboard.writeText(resultsText)
      // You could add a toast notification here
      console.log('Results copied to clipboard')
    } catch (error) {
      console.error('Failed to copy results:', error)
      // Fallback: select text for manual copy
      const textArea = document.createElement('textarea')
      textArea.value = resultsText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  // Use actual data or fallback to defaults
  const displayTokenUsage = tokenUsage || {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  }
  const displayExecutionTime = executionTime || 0
  const displayCost = cost || 0

  // Create a TestRun object from current test data for export
  const currentTestRun: TestRun | null = results && response && model ? {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    model: model.name,
    modelProvider: model.provider,
    instructions: currentTest.instructions,
    prompt: currentTest.prompt,
    response,
    metrics: results,
    tokenUsage: displayTokenUsage,
    executionTime: displayExecutionTime,
    cost: displayCost
  } : null

  return (
    <div className="space-y-6">
      {/* Success indicator */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-success mb-2">
          <CheckCircle size={24} weight="fill" />
          <span className="font-medium">Evaluation Complete</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your instructions have been tested and evaluated
        </p>
      </div>

      {/* Overall score with circular progress */}
      <div className="flex justify-center">
        <CircularProgress value={results.overallScore} />
      </div>

      {/* Individual metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <MetricBar
          label="Coherence"
          value={results.coherenceScore}
          color="bg-blue-500"
        />
        <MetricBar
          label="Task Completion"
          value={results.taskCompletionScore}
          color="bg-green-500"
        />
        <MetricBar
          label="Instruction Adherence"
          value={results.instructionAdherenceScore}
          color="bg-purple-500"
        />
        <MetricBar
          label="Efficiency"
          value={results.efficiencyScore}
          color="bg-orange-500"
        />
      </div>

      {/* Statistics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Hash size={16} />}
          label="Total Tokens"
          value={displayTokenUsage.totalTokens}
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Execution Time"
          value={displayExecutionTime / 1000} // Convert ms to seconds
          suffix="s"
          decimals={1}
        />
        <StatCard
          icon={<CurrencyDollar size={16} />}
          label="Cost"
          value={displayCost}
          suffix=""
          decimals={4}
        />
        <StatCard
          icon={<Hash size={16} />}
          label="Model"
          value={model.name}
        />
      </div>

      {/* Evaluation explanation */}
      {results.explanation && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Evaluation Summary</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {results.explanation}
          </p>
        </div>
      )}

      {/* System Instructions (collapsible) */}
      <div className="bg-muted/50 rounded-lg p-4">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-medium text-foreground">System Instructions</h4>
          {showInstructions ? (
            <CaretDown size={16} className="text-muted-foreground" />
          ) : (
            <CaretRight size={16} className="text-muted-foreground" />
          )}
        </button>
        {showInstructions && (
          <div className="mt-3 bg-background rounded border p-3 max-h-32 overflow-y-auto">
            <p className="text-sm text-foreground font-mono whitespace-pre-wrap">
              {currentTest.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Response preview */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-foreground">Model Response</h4>
          <button
            onClick={() => handleCopyResults()}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted/50 transition-colors"
            title="Copy all results to clipboard"
          >
            <Copy size={12} />
            Copy Results
          </button>
        </div>
        <div className="bg-background rounded border p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-foreground font-mono whitespace-pre-wrap">
            {response}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-border">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 border border-border text-foreground rounded-md hover:bg-muted/50 transition-colors min-h-[44px]"
        >
          <Download size={16} />
          <span className="text-sm sm:text-base">Export Results</span>
        </button>
        <button
          onClick={handleRunAgain}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-h-[44px]"
        >
          <ArrowClockwise size={16} />
          <span className="text-sm sm:text-base">Run Again</span>
        </button>
        <button
          onClick={handleNewTest}
          className="flex-1 px-4 py-3 sm:py-2 border border-border text-foreground rounded-md hover:bg-muted/50 transition-colors min-h-[44px] text-sm sm:text-base"
        >
          New Test
        </button>
      </div>

      {/* Export Modal */}
      {currentTestRun && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          testRuns={[]}
          singleTest={currentTestRun}
          title="Export Test Results"
        />
      )}
    </div>
  )
}