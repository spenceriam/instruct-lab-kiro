'use client'

import { ClockClockwise, PlayCircle, FileText, Trash } from 'phosphor-react'

interface TestRun {
  id: string
  timestamp: number
  model: string
  overallScore: number
  coherenceScore: number
  taskCompletionScore: number
  instructionAdherenceScore: number
  efficiencyScore: number
  tokenUsage: number
  executionTime: number
  cost: number
}

interface TestHistoryProps {
  testRuns?: TestRun[]
  onStartTesting?: () => void
  onClearHistory?: () => void
}

export default function TestHistory({ 
  testRuns = [], 
  onStartTesting,
  onClearHistory 
}: TestHistoryProps) {
  const hasHistory = testRuns.length > 0

  if (!hasHistory) {
    return (
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
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
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Test History
            </h2>
            <p className="text-muted-foreground">
              {testRuns.length} test{testRuns.length !== 1 ? 's' : ''} completed
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onStartTesting}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
            >
              <PlayCircle size={16} />
              New Test
            </button>
            
            <button
              onClick={onClearHistory}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 gap-2"
            >
              <Trash size={16} />
              Clear History
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-custom-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-foreground text-sm">Model</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Overall Score</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Coherence</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Task Complete</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Adherence</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Efficiency</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Tokens</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Time</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Cost</th>
                  <th className="text-center py-3 px-4 font-medium text-foreground text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {testRuns.map((run, index) => (
                  <tr key={run.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{run.model}</td>
                    <td className="py-3 px-4 text-center">
                      <div className={`text-sm font-medium ${
                        run.overallScore >= 80 ? 'text-success' :
                        run.overallScore >= 60 ? 'text-warning' : 'text-error'
                      }`}>
                        {run.overallScore}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">{run.coherenceScore}%</td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">{run.taskCompletionScore}%</td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">{run.instructionAdherenceScore}%</td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">{run.efficiencyScore}%</td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">{run.tokenUsage.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">{run.executionTime}ms</td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">${run.cost.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                      {new Date(run.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Export Options */}
          <div className="border-t border-border px-4 py-3 bg-muted/20">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                All data stored locally in your browser session
              </div>
              <button className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium">
                <FileText size={16} />
                Export Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}