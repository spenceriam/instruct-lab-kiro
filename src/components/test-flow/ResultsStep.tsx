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

interface HistoryTestCardProps {
  test: TestRun
  testNumber: number
}

function HistoryTestCard({ test, testNumber }: HistoryTestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  return (
    <div className="bg-background rounded border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left hover:bg-muted/30 transition-colors"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              #{testNumber}
            </span>
            <span className="text-sm font-medium text-foreground">
              {test.model}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(test.timestamp).toLocaleDateString()} {new Date(test.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <CaretDown size={14} className="text-muted-foreground" />
            ) : (
              <CaretRight size={14} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Overall</div>
            <div className={`text-sm font-medium ${getScoreColor(test.metrics.overallScore)}`}>
              {test.metrics.overallScore}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Coherence</div>
            <div className={`text-sm font-medium ${getScoreColor(test.metrics.coherenceScore)}`}>
              {test.metrics.coherenceScore}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Task</div>
            <div className={`text-sm font-medium ${getScoreColor(test.metrics.taskCompletionScore)}`}>
              {test.metrics.taskCompletionScore}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Adherence</div>
            <div className={`text-sm font-medium ${getScoreColor(test.metrics.instructionAdherenceScore)}`}>
              {test.metrics.instructionAdherenceScore}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Efficiency</div>
            <div className={`text-sm font-medium ${getScoreColor(test.metrics.efficiencyScore)}`}>
              {test.metrics.efficiencyScore}%
            </div>
          </div>
        </div>

        {/* Performance Row */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate flex-1 mr-4">
            {test.prompt}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{(test.executionTime / 1000).toFixed(1)}s</span>
            <span>${test.cost.toFixed(4)}</span>
            <span>{test.tokenUsage.totalTokens} tokens</span>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Detailed Metrics */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-3">Detailed Scores</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Coherence</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getScoreBgColor(test.metrics.coherenceScore)}`}>
                    {test.metrics.coherenceScore}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${test.metrics.coherenceScore}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Task Completion</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getScoreBgColor(test.metrics.taskCompletionScore)}`}>
                    {test.metrics.taskCompletionScore}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-green-500"
                    style={{ width: `${test.metrics.taskCompletionScore}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Instruction Adherence</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getScoreBgColor(test.metrics.instructionAdherenceScore)}`}>
                    {test.metrics.instructionAdherenceScore}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-purple-500"
                    style={{ width: `${test.metrics.instructionAdherenceScore}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Efficiency</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getScoreBgColor(test.metrics.efficiencyScore)}`}>
                    {test.metrics.efficiencyScore}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-orange-500"
                    style={{ width: `${test.metrics.efficiencyScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Prompt */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Test Prompt</h5>
            <div className="bg-muted/30 rounded p-3 max-h-20 overflow-y-auto">
              <p className="text-xs text-foreground font-mono whitespace-pre-wrap">
                {test.prompt}
              </p>
            </div>
          </div>

          {/* Model Response */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Model Response</h5>
            <div className="bg-muted/30 rounded p-3 max-h-24 overflow-y-auto">
              <p className="text-xs text-foreground font-mono whitespace-pre-wrap">
                {test.response}
              </p>
            </div>
          </div>

          {/* Evaluation Analysis */}
          {test.metrics.explanation && (
            <div>
              <h5 className="text-sm font-medium text-foreground mb-2">AI Evaluation Analysis</h5>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  {test.metrics.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Performance</h5>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-muted/30 rounded p-2">
                <div className="text-xs text-muted-foreground">Execution Time</div>
                <div className="text-sm font-medium text-foreground">
                  {(test.executionTime / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="text-center bg-muted/30 rounded p-2">
                <div className="text-xs text-muted-foreground">Cost</div>
                <div className="text-sm font-medium text-foreground">
                  ${test.cost.toFixed(4)}
                </div>
              </div>
              <div className="text-center bg-muted/30 rounded p-2">
                <div className="text-xs text-muted-foreground">Tokens</div>
                <div className="text-sm font-medium text-foreground">
                  {test.tokenUsage.totalTokens}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ResultsStep() {
  const { currentTest, testHistory, setCurrentStep, resetCurrentTest } = useAppStore()
  const { results, response, model, tokenUsage, executionTime, cost } = currentTest
  const [showExportModal, setShowExportModal] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

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

      {/* Test History (collapsible) */}
      {testHistory.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-foreground">
              Previous Tests ({testHistory.length})
            </h4>
            {showHistory ? (
              <CaretDown size={16} className="text-muted-foreground" />
            ) : (
              <CaretRight size={16} className="text-muted-foreground" />
            )}
          </button>
          {showHistory && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {testHistory
                .slice()
                .reverse() // Show most recent first
                .slice(0, 5) // Limit to last 5 tests
                .map((test, index) => (
                  <HistoryTestCard 
                    key={test.id} 
                    test={test} 
                    testNumber={testHistory.length - index}
                  />
                ))}
              {testHistory.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Showing last 5 of {testHistory.length} tests
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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