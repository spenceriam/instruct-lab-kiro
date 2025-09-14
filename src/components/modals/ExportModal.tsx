'use client'

import React, { useState } from 'react'
import { X, Download, FileText, Table, FilePdf, CheckCircle, Warning } from 'phosphor-react'
import Modal from '@/components/ui/Modal'
import { ExportService, ExportFormat } from '@/services'
import { TestRun } from '@/lib/types'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  testRuns: TestRun[]
  singleTest?: TestRun | null
  title?: string
}

interface ExportOption {
  format: ExportFormat
  label: string
  description: string
  icon: React.ReactNode
  fileExtension: string
}

const exportOptions: ExportOption[] = [
  {
    format: 'json',
    label: 'JSON',
    description: 'Complete data with metadata for programmatic use',
    icon: <FileText size={20} />,
    fileExtension: '.json'
  },
  {
    format: 'csv',
    label: 'CSV',
    description: 'Spreadsheet format for analysis and visualization',
    icon: <Table size={20} />,
    fileExtension: '.csv'
  },
  {
    format: 'pdf',
    label: 'PDF',
    description: 'Formatted report with charts and summaries',
    icon: <FilePdf size={20} />,
    fileExtension: '.pdf'
  }
]

export default function ExportModal({ 
  isOpen, 
  onClose, 
  testRuns, 
  singleTest = null,
  title
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const isSingleTest = singleTest !== null
  const exportData = isSingleTest ? [singleTest] : testRuns
  const exportTitle = title || (isSingleTest ? 'Export Test Result' : 'Export Test History')

  const handleExport = async () => {
    if (exportData.length === 0) {
      setExportStatus({
        type: 'error',
        message: 'No data available to export'
      })
      return
    }

    setIsExporting(true)
    setExportStatus({ type: null, message: '' })

    try {
      if (isSingleTest && singleTest) {
        await ExportService.exportSingleTest(singleTest, selectedFormat)
      } else {
        await ExportService.exportHistory(testRuns, selectedFormat)
      }

      setExportStatus({
        type: 'success',
        message: `Successfully exported ${exportData.length} test${exportData.length !== 1 ? 's' : ''} as ${selectedFormat.toUpperCase()}`
      })

      // Auto-close after successful export
      setTimeout(() => {
        onClose()
        setExportStatus({ type: null, message: '' })
      }, 2000)
    } catch (error) {
      console.error('Export failed:', error)
      setExportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Export failed. Please try again.'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      onClose()
      setExportStatus({ type: null, message: '' })
    }
  }

  const selectedOption = exportOptions.find(option => option.format === selectedFormat)

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-card border border-border rounded-lg shadow-custom-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {exportTitle}
          </h2>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export info */}
          <div className="text-sm text-muted-foreground">
            {isSingleTest ? (
              <>Exporting 1 test result from {singleTest?.model}</>
            ) : (
              <>Exporting {testRuns.length} test{testRuns.length !== 1 ? 's' : ''} from your history</>
            )}
          </div>

          {/* Format selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Choose export format:
            </label>
            <div className="space-y-2">
              {exportOptions.map((option) => (
                <label
                  key={option.format}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === option.format
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value={option.format}
                    checked={selectedFormat === option.format}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    className="mt-1"
                    disabled={isExporting}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {option.icon}
                      <span className="font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {option.fileExtension}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* PDF Note */}
          {selectedFormat === 'pdf' && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Warning size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm text-warning-foreground">
                  <strong>PDF Export Note:</strong> PDF generation will open your browser&apos;s print dialog. 
                  Choose &quot;Save as PDF&quot; as the destination to download the file.
                </div>
              </div>
            </div>
          )}

          {/* Status message */}
          {exportStatus.type && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              exportStatus.type === 'success' 
                ? 'bg-success/10 border border-success/20 text-success-foreground'
                : 'bg-error/10 border border-error/20 text-error-foreground'
            }`}>
              {exportStatus.type === 'success' ? (
                <CheckCircle size={16} className="flex-shrink-0" />
              ) : (
                <Warning size={16} className="flex-shrink-0" />
              )}
              <span className="text-sm">{exportStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || exportData.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export {selectedOption?.label}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}