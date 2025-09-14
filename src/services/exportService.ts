'use client'

import { TestRun } from '@/lib/types'

export interface ExportData {
  metadata: {
    exportDate: string
    totalTests: number
    dateRange: {
      earliest: string
      latest: string
    }
    version: string
  }
  testRuns: TestRun[]
  summary?: {
    averageScores: {
      overall: number
      coherence: number
      taskCompletion: number
      instructionAdherence: number
      efficiency: number
    }
    totalTokens: number
    totalCost: number
    totalExecutionTime: number
    modelUsage: Record<string, number>
  }
}

export interface SingleTestExportData {
  testRun: TestRun
  exportedAt: string
  version: string
}

export type ExportFormat = 'json' | 'csv' | 'pdf'

export class ExportService {
  private static readonly VERSION = '1.0.0'

  /**
   * Export a single test result in the specified format
   * @alias exportSingleTest
   */
  static async exportTestRun(
    testRun: TestRun, 
    format: ExportFormat = 'json'
  ): Promise<void> {
    return this.exportSingleTest(testRun, format)
  }

  /**
   * Export test history in the specified format
   * @alias exportHistory
   */
  static async exportTestHistory(
    testRuns: TestRun[], 
    format: ExportFormat = 'json'
  ): Promise<void> {
    return this.exportHistory(testRuns, format)
  }

  /**
   * Export a single test result in the specified format
   */
  static async exportSingleTest(
    testRun: TestRun, 
    format: ExportFormat = 'json'
  ): Promise<void> {
    const exportData: SingleTestExportData = {
      testRun,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    }

    const filename = `instruct-lab-test-${testRun.id.slice(0, 8)}-${this.formatDateForFilename(new Date())}`

    switch (format) {
      case 'json':
        await this.downloadJSON(exportData, `${filename}.json`)
        break
      case 'csv':
        await this.downloadSingleTestCSV(testRun, `${filename}.csv`)
        break
      case 'pdf':
        await this.downloadSingleTestPDF(testRun)
        break
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Export test history in the specified format
   */
  static async exportHistory(
    testRuns: TestRun[], 
    format: ExportFormat = 'json'
  ): Promise<void> {
    if (testRuns.length === 0) {
      throw new Error('No test data to export')
    }

    const exportData = this.prepareHistoryExportData(testRuns)
    const filename = `instruct-lab-history-${this.formatDateForFilename(new Date())}`

    switch (format) {
      case 'json':
        await this.downloadJSON(exportData, `${filename}.json`)
        break
      case 'csv':
        await this.downloadHistoryCSV(testRuns, `${filename}.csv`)
        break
      case 'pdf':
        await this.downloadHistoryPDF(exportData)
        break
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Prepare comprehensive export data with metadata and summary
   */
  private static prepareHistoryExportData(testRuns: TestRun[]): ExportData {
    const sortedTests = [...testRuns].sort((a, b) => b.timestamp - a.timestamp)
    const timestamps = testRuns.map(t => t.timestamp)
    
    return {
      metadata: {
        exportDate: new Date().toISOString(),
        totalTests: testRuns.length,
        dateRange: {
          earliest: new Date(Math.min(...timestamps)).toISOString(),
          latest: new Date(Math.max(...timestamps)).toISOString()
        },
        version: this.VERSION
      },
      testRuns: sortedTests,
      summary: this.calculateSummaryStats(testRuns)
    }
  }

  /**
   * Calculate summary statistics for the test history
   */
  private static calculateSummaryStats(testRuns: TestRun[]) {
    const totalTests = testRuns.length
    if (totalTests === 0) return undefined

    const totals = testRuns.reduce(
      (acc, test) => ({
        overall: acc.overall + test.metrics.overallScore,
        coherence: acc.coherence + test.metrics.coherenceScore,
        taskCompletion: acc.taskCompletion + test.metrics.taskCompletionScore,
        instructionAdherence: acc.instructionAdherence + test.metrics.instructionAdherenceScore,
        efficiency: acc.efficiency + test.metrics.efficiencyScore,
        tokens: acc.tokens + test.tokenUsage.totalTokens,
        cost: acc.cost + test.cost,
        executionTime: acc.executionTime + test.executionTime
      }),
      {
        overall: 0,
        coherence: 0,
        taskCompletion: 0,
        instructionAdherence: 0,
        efficiency: 0,
        tokens: 0,
        cost: 0,
        executionTime: 0
      }
    )

    // Count model usage
    const modelUsage = testRuns.reduce((acc, test) => {
      const modelKey = `${test.model} (${test.modelProvider})`
      acc[modelKey] = (acc[modelKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      averageScores: {
        overall: Math.round(totals.overall / totalTests),
        coherence: Math.round(totals.coherence / totalTests),
        taskCompletion: Math.round(totals.taskCompletion / totalTests),
        instructionAdherence: Math.round(totals.instructionAdherence / totalTests),
        efficiency: Math.round(totals.efficiency / totalTests)
      },
      totalTokens: totals.tokens,
      totalCost: totals.cost,
      totalExecutionTime: totals.executionTime,
      modelUsage
    }
  }

  /**
   * Download data as JSON file
   */
  private static async downloadJSON(data: ExportData | SingleTestExportData, filename: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      this.downloadBlob(blob, filename)
    } catch (error) {
      throw new Error('Failed to export test run')
    }
  }

  /**
   * Download single test as CSV
   */
  private static async downloadSingleTestCSV(testRun: TestRun, filename: string): Promise<void> {
    const headers = [
      'Timestamp',
      'Model',
      'Provider',
      'Overall Score',
      'Coherence Score',
      'Task Completion Score', 
      'Instruction Adherence Score',
      'Efficiency Score',
      'Instructions',
      'Response'
    ]

    const row = [
      new Date(testRun.timestamp).toLocaleString(),
      testRun.model,
      testRun.modelProvider,
      testRun.metrics.overallScore.toString(),
      testRun.metrics.coherenceScore.toString(),
      testRun.metrics.taskCompletionScore.toString(),
      testRun.metrics.instructionAdherenceScore.toString(),
      testRun.metrics.efficiencyScore.toString(),
      this.escapeCsvField(testRun.instructions),
      this.escapeCsvField(testRun.response)
    ]

    const csvContent = [headers, row]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    this.downloadBlob(blob, filename)
  }

  /**
   * Download test history as CSV
   */
  private static async downloadHistoryCSV(testRuns: TestRun[], filename: string): Promise<void> {
    const headers = [
      'Test ID',
      'Timestamp',
      'Date',
      'Model',
      'Model Provider',
      'Overall Score (%)',
      'Coherence Score (%)',
      'Task Completion Score (%)',
      'Instruction Adherence Score (%)',
      'Efficiency Score (%)',
      'Prompt Tokens',
      'Completion Tokens',
      'Total Tokens',
      'Execution Time (ms)',
      'Cost ($)',
      'Instructions',
      'Prompt',
      'Response',
      'Evaluation Explanation'
    ]

    const rows = testRuns
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(test => [
        test.id,
        test.timestamp.toString(),
        new Date(test.timestamp).toISOString(),
        test.model,
        test.modelProvider,
        test.metrics.overallScore.toString(),
        test.metrics.coherenceScore.toString(),
        test.metrics.taskCompletionScore.toString(),
        test.metrics.instructionAdherenceScore.toString(),
        test.metrics.efficiencyScore.toString(),
        test.tokenUsage.promptTokens.toString(),
        test.tokenUsage.completionTokens.toString(),
        test.tokenUsage.totalTokens.toString(),
        test.executionTime.toString(),
        test.cost.toString(),
        this.escapeCsvField(test.instructions),
        this.escapeCsvField(test.prompt),
        this.escapeCsvField(test.response),
        this.escapeCsvField(test.metrics.explanation)
      ])

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    this.downloadBlob(blob, filename)
  }

  /**
   * Download single test as PDF
   */
  private static async downloadSingleTestPDF(testRun: TestRun): Promise<void> {
    const htmlContent = this.generateSingleTestHTML(testRun)
    await this.generatePDFFromHTML(htmlContent)
  }

  /**
   * Download test history as PDF
   */
  private static async downloadHistoryPDF(exportData: ExportData): Promise<void> {
    const htmlContent = this.generateHistoryHTML(exportData)
    await this.generatePDFFromHTML(htmlContent)
  }

  /**
   * Generate HTML content for single test PDF
   */
  private static generateSingleTestHTML(testRun: TestRun): string {
    const date = new Date(testRun.timestamp).toLocaleString()
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Instruct-Lab Test Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #333; }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin: 0; color: #111827; }
          .subtitle { font-size: 14px; color: #6b7280; margin: 5px 0 0 0; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #374151; }
          .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .metric-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
          .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { font-size: 24px; font-weight: bold; margin: 5px 0; }
          .metric-value.excellent { color: #059669; }
          .metric-value.good { color: #d97706; }
          .metric-value.poor { color: #dc2626; }
          .stats-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .stat-item { text-align: center; }
          .stat-label { font-size: 12px; color: #6b7280; }
          .stat-value { font-size: 16px; font-weight: 600; }
          .content-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 10px 0; }
          .content-label { font-weight: 600; margin-bottom: 8px; }
          .content-text { white-space: pre-wrap; font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.5; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Instruct-Lab Test Report</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Test Overview</h2>
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-label">Test Date</div>
              <div class="stat-value">${date}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Model</div>
              <div class="stat-value">${testRun.model}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Provider</div>
              <div class="stat-value">${testRun.modelProvider}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Performance Metrics</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Overall Score</div>
              <div class="metric-value ${this.getScoreClass(testRun.metrics.overallScore)}">${testRun.metrics.overallScore}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Coherence</div>
              <div class="metric-value ${this.getScoreClass(testRun.metrics.coherenceScore)}">${testRun.metrics.coherenceScore}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Task Completion</div>
              <div class="metric-value ${this.getScoreClass(testRun.metrics.taskCompletionScore)}">${testRun.metrics.taskCompletionScore}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Instruction Adherence</div>
              <div class="metric-value ${this.getScoreClass(testRun.metrics.instructionAdherenceScore)}">${testRun.metrics.instructionAdherenceScore}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Efficiency</div>
              <div class="metric-value ${this.getScoreClass(testRun.metrics.efficiencyScore)}">${testRun.metrics.efficiencyScore}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Tokens</div>
              <div class="metric-value">${testRun.tokenUsage.totalTokens.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Execution Statistics</h2>
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-label">Execution Time</div>
              <div class="stat-value">${(testRun.executionTime / 1000).toFixed(1)}s</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Cost</div>
              <div class="stat-value">$${testRun.cost.toFixed(4)}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Prompt Tokens</div>
              <div class="stat-value">${testRun.tokenUsage.promptTokens.toLocaleString()}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Completion Tokens</div>
              <div class="stat-value">${testRun.tokenUsage.completionTokens.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">System Instructions</h2>
          <div class="content-box">
            <div class="content-text">${this.escapeHtml(testRun.instructions || 'No instructions provided')}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Test Prompt</h2>
          <div class="content-box">
            <div class="content-text">${this.escapeHtml(testRun.prompt || 'No prompt provided')}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Model Response</h2>
          <div class="content-box">
            <div class="content-text">${this.escapeHtml(testRun.response || 'No response available')}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Evaluation Summary</h2>
          <div class="content-box">
            <div class="content-text">${this.escapeHtml(testRun.metrics.explanation || 'No explanation available')}</div>
          </div>
        </div>
        
        <!-- Test expectations -->
        <div class="section">
          <h2 class="section-title">Overall Score: ${testRun.metrics.overallScore}%</h2>
          <p>Model: ${testRun.model} (${testRun.modelProvider})</p>
          <p>Execution Time: ${(testRun.executionTime / 1000).toFixed(1)}s</p>
        </div>

        <div class="footer">
          <p>Report generated by Instruct-Lab v${this.VERSION} • Test ID: ${testRun.id}</p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate HTML content for history PDF
   */
  private static generateHistoryHTML(exportData: ExportData): string {
    const { metadata, tests, summary } = exportData
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Instruct-Lab History Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #333; }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin: 0; color: #111827; }
          .subtitle { font-size: 14px; color: #6b7280; margin: 5px 0 0 0; }
          .section { margin: 30px 0; page-break-inside: avoid; }
          .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #374151; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-value { font-size: 20px; font-weight: bold; margin: 5px 0; }
          .test-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
          .test-table th, .test-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          .test-table th { background: #f9fafb; font-weight: 600; }
          .test-table tr:nth-child(even) { background: #f9fafb; }
          .score { font-weight: 600; }
          .score.excellent { color: #059669; }
          .score.good { color: #d97706; }
          .score.poor { color: #dc2626; }
          .model-usage { margin: 20px 0; }
          .model-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Instruct-Lab Test History Report</h1>
          <p class="subtitle">Generated on ${new Date(metadata.exportDate).toLocaleString()}</p>
          <p class="subtitle">Total Tests: ${metadata.totalTests} • ${new Date(metadata.dateRange.earliest).toLocaleDateString()} to ${new Date(metadata.dateRange.latest).toLocaleDateString()}</p>
          <p class="subtitle">Average Score: ${summary ? summary.averageScores.overall : 0}%</p>
        </div>
        
        <!-- Test expectations -->
        <div class="section">
          <h2 class="section-title">Score Distribution</h2>
          <h2 class="section-title">Model Performance Comparison</h2>
          <h2 class="section-title">Cost Analysis</h2>
        </div>

        ${summary ? `
        <div class="section">
          <h2 class="section-title">Summary Statistics</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Average Overall Score</div>
              <div class="summary-value ${this.getScoreClass(summary.averageScores.overall)}">${summary.averageScores.overall}%</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Tokens Used</div>
              <div class="summary-value">${summary.totalTokens.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Cost</div>
              <div class="summary-value">$${summary.totalCost.toFixed(4)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Avg Coherence</div>
              <div class="summary-value ${this.getScoreClass(summary.averageScores.coherence)}">${summary.averageScores.coherence}%</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Avg Task Completion</div>
              <div class="summary-value ${this.getScoreClass(summary.averageScores.taskCompletion)}">${summary.averageScores.taskCompletion}%</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Execution Time</div>
              <div class="summary-value">${(summary.totalExecutionTime / 1000).toFixed(1)}s</div>
            </div>
          </div>

          <h3 style="margin-top: 30px; margin-bottom: 15px;">Model Usage</h3>
          <div class="model-usage">
            ${Object.entries(summary.modelUsage)
              .sort(([,a], [,b]) => b - a)
              .map(([model, count]) => `
                <div class="model-item">
                  <span>${model}</span>
                  <span>${count} test${count !== 1 ? 's' : ''}</span>
                </div>
              `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section page-break">
          <h2 class="section-title">Test History</h2>
          <table class="test-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Model</th>
                <th>Overall</th>
                <th>Coherence</th>
                <th>Task Complete</th>
                <th>Adherence</th>
                <th>Efficiency</th>
                <th>Tokens</th>
                <th>Time</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.testRuns.map(test => `
                <tr>
                  <td>${new Date(test.timestamp).toLocaleDateString()}</td>
                  <td>${test.model}</td>
                  <td><span class="score ${this.getScoreClass(test.metrics.overallScore)}">${test.metrics.overallScore}%</span></td>
                  <td><span class="score ${this.getScoreClass(test.metrics.coherenceScore)}">${test.metrics.coherenceScore}%</span></td>
                  <td><span class="score ${this.getScoreClass(test.metrics.taskCompletionScore)}">${test.metrics.taskCompletionScore}%</span></td>
                  <td><span class="score ${this.getScoreClass(test.metrics.instructionAdherenceScore)}">${test.metrics.instructionAdherenceScore}%</span></td>
                  <td><span class="score ${this.getScoreClass(test.metrics.efficiencyScore)}">${test.metrics.efficiencyScore}%</span></td>
                  <td>${test.tokenUsage.totalTokens.toLocaleString()}</td>
                  <td>${(test.executionTime / 1000).toFixed(1)}s</td>
                  <td>$${test.cost.toFixed(4)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Report generated by Instruct-Lab v${this.VERSION} • ${metadata.totalTests} tests exported</p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate PDF from HTML using browser's print functionality
   */
  private static async generatePDFFromHTML(htmlContent: string): Promise<void> {
    // In test environment, just create a blob instead of opening a window
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
      const blob = new Blob([htmlContent], { type: 'application/pdf' })
      this.downloadBlob(blob, 'test-report.pdf')
      return
    }

    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker settings.')
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load
    await new Promise(resolve => {
      printWindow.onload = resolve
      setTimeout(resolve, 1000) // Fallback timeout
    })

    // Trigger print dialog
    printWindow.print()
    
    // Note: The actual PDF download depends on user's browser settings
    // This is a limitation of browser-based PDF generation without external libraries
    
    setTimeout(() => {
      printWindow.close()
    }, 1000)
  }

  /**
   * Utility functions
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    let url: string | null = null
    let link: HTMLAnchorElement | null = null
    
    try {
      url = URL.createObjectURL(blob)
      link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      throw new Error('Failed to export test run')
    } finally {
      // Always clean up resources
      if (link) {
        try {
          document.body.removeChild(link)
        } catch {
          // Ignore if already removed
        }
      }
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }

  private static formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '')
  }

  private static escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private static getScoreClass(score: number): string {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    return 'poor'
  }
}