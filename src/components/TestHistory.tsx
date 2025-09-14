'use client'

import React, { useState } from 'react'
import { ClockClockwise, PlayCircle, FileText, Trash, Warning, X, Download } from 'phosphor-react'
import { TestRun } from '@/lib/types'
import { ExportModal } from '@/components/modals'
import { TestHistorySkeleton } from '@/components/ui/LoadingStates'

interface TestHistoryProps {
  testRuns?: TestRun[]
  onStartTesting?: () => void
  onClearHistory?: () => void
  isLoading?: boolean
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-lg shadow-custom-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-error/10 text-error' :
            variant === 'warning' ? 'bg-warning/10 text-warning' :
            'bg-primary/10 text-primary'
          }`}>
            <Warning size={20} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {message}
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 ${
                  variant === 'danger' 
                    ? 'bg-error text-error-foreground hover:bg-error/90'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TestHistory({ 
  testRuns = [], 
  onStartTesting,
  onClearHistory,
  isLoading = false
}: TestHistoryProps) {
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const hasHistory = testRuns.length > 0

  const handleClearHistory = () => {
    setShowClearConfirmation(true)
  }

  const handleConfirmClear = () => {
    onClearHistory?.()
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      })
    }
  }

  const formatCost = (cost: number) => {
    if (cost < 0.001) {
      return '<$0.001'
    }
    return `$${cost.toFixed(4)}`
  }

  const formatExecutionTime = (time: number) => {
    if (time < 1000) {
      return `${time}ms`
    }
    return `${(time / 1000).toFixed(1)}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-error'
  }

  if (!hasHistory) {
    return (
      <section id="test-history" className="py-16" role="region" aria-labelledby="history-title">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 id="history-title" className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Your Test History
            </h2>
            <p className="text-muted-foreground">
              Track your instruction optimization progress and compare results over time.
            </p>
          </div>

          {/* Empty State */}
          <div className="bg-card border border-border rounded-lg p-12 text-center shadow-custom-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockClockwise size={32} className="text-muted-foreground" />
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">
              No tests yet
            </h3>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Run your first evaluation to see quantitative metrics and start optimizing 
              your AI system instructions.
            </p>

            <div className="space-y-4">
              <button
                onClick={onStartTesting}
                className="inline-flex items-center justify-center rounded-md text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 gap-3 shadow-custom-md hover:shadow-custom-lg transition-shadow"
              >
                <PlayCircle size={24} />
                Run Your First Test
              </button>
              
              <div className="text-sm text-muted-foreground">
                Takes 30-60 seconds • Requires OpenRouter API key
              </div>
            </div>

            {/* Preview of what they'll see */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                After running tests, you&apos;ll see:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  Success probability scores
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  Token usage & costs
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-error rounded-full"></div>
                  Performance metrics
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // History table view (for when there are test runs)
  return (
    <section id="test-history" className="py-16" role="region" aria-labelledby="history-title-filled">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h2 id="history-title-filled" className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Test History
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {testRuns.length} test{testRuns.length !== 1 ? 's' : ''} completed
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={onStartTesting}
              className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-10 px-3 sm:px-4 gap-1 sm:gap-2 min-h-[44px]"
            >
              <PlayCircle size={16} />
              <span className="hidden sm:inline">New Test</span>
              <span className="sm:hidden">New</span>
            </button>
            
            <button
              onClick={handleExport}
              disabled={isLoading || testRuns.length === 0}
              className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 sm:h-10 px-3 sm:px-4 gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <Download size={16} />
              Export
            </button>
            
            <button
              onClick={handleClearHistory}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 sm:h-10 px-3 sm:px-4 gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <Trash size={16} />
              <span className="hidden sm:inline">Clear History</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-custom-sm">
          {isLoading ? (
            <TestHistorySkeleton />
          ) : (
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full min-w-[800px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[120px] sm:min-w-[140px]">Model</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">Overall</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[70px] sm:min-w-[90px]">Coherence</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">Task</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[70px] sm:min-w-[90px]">Adherence</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[70px] sm:min-w-[90px]">Efficiency</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[60px] sm:min-w-[80px]">Tokens</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[50px] sm:min-w-[70px]">Time</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[60px] sm:min-w-[80px]">Cost</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {testRuns.map((run, index) => {
                    const { date, time } = formatDate(run.timestamp)
                    return (
                      <tr key={run.id} className={`hover:bg-muted/30 transition-colors ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      }`}>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                          <div className="font-medium text-foreground truncate max-w-[100px] sm:max-w-[120px]" title={run.model}>
                            {run.model}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-[120px]" title={run.modelProvider}>
                            {run.modelProvider}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <div className={`text-xs sm:text-sm font-semibold ${getScoreColor(run.metrics.overallScore)}`}>
                            {run.metrics.overallScore}%
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <div className={`text-xs sm:text-sm ${getScoreColor(run.metrics.coherenceScore)}`}>
                            {run.metrics.coherenceScore}%
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <div className={`text-xs sm:text-sm ${getScoreColor(run.metrics.taskCompletionScore)}`}>
                            {run.metrics.taskCompletionScore}%
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <div className={`text-xs sm:text-sm ${getScoreColor(run.metrics.instructionAdherenceScore)}`}>
                            {run.metrics.instructionAdherenceScore}%
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <div className={`text-xs sm:text-sm ${getScoreColor(run.metrics.efficiencyScore)}`}>
                            {run.metrics.efficiencyScore}%
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
                          {run.tokenUsage.totalTokens > 1000 
                            ? `${(run.tokenUsage.totalTokens / 1000).toFixed(1)}k`
                            : run.tokenUsage.totalTokens.toLocaleString()
                          }
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
                          {formatExecutionTime(run.executionTime)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
                          {formatCost(run.cost)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
                          <div className="hidden sm:block">{date}</div>
                          <div className="hidden sm:block text-xs opacity-75">{time}</div>
                          <div className="sm:hidden text-xs">
                            {new Date(run.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Export Options */}
          <div className="border-t border-border px-4 py-3 bg-muted/20">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                All data stored locally in your browser session
              </div>
              <button 
                onClick={handleExport}
                disabled={testRuns.length === 0}
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} />
                Export Results
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showClearConfirmation}
          onClose={() => setShowClearConfirmation(false)}
          onConfirm={handleConfirmClear}
          title="Clear Test History"
          message="Are you sure you want to clear all test history? This action cannot be undone and will permanently remove all your test results from this session."
          confirmText="Clear History"
          cancelText="Cancel"
          variant="danger"
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          testRuns={testRuns}
          title="Export Test History"
        />
      </div>
    </section>
  )
}