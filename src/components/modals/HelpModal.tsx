'use client'

import Modal from '@/components/ui/Modal'
import { useModal } from '@/lib/modalManager'
import { CheckCircle, Target, FileText, Lightning } from 'phosphor-react'

export const HELP_MODAL_ID = 'help-modal'

export default function HelpModal() {
  const { isOpen, close } = useModal(HELP_MODAL_ID)

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="How does this work?"
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Dual-Model Evaluation Process
          </h3>
          <p className="text-muted-foreground mb-4">
            Instruct-Lab uses a sophisticated two-step process to quantitatively evaluate your AI system instructions:
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Primary Execution</h4>
              <p className="text-sm text-muted-foreground">
                Your selected AI model executes your system instructions with your test prompt, generating a response.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Evaluation Analysis</h4>
              <p className="text-sm text-muted-foreground">
                GPT-4 analyzes the response against your original instructions and prompt, scoring effectiveness across multiple dimensions.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Evaluation Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3 p-3 border border-border rounded-lg">
              <CheckCircle size={20} className="text-success flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Coherence (20%)</h4>
                <p className="text-xs text-muted-foreground">Logical structure and clarity of response</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 border border-border rounded-lg">
              <Target size={20} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Task Completion (35%)</h4>
                <p className="text-xs text-muted-foreground">How fully the response addresses the prompt</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 border border-border rounded-lg">
              <FileText size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Instruction Adherence (35%)</h4>
                <p className="text-xs text-muted-foreground">Following your system instructions precisely</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 border border-border rounded-lg">
              <Lightning size={20} className="text-error flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Efficiency (10%)</h4>
                <p className="text-xs text-muted-foreground">Conciseness while remaining complete</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Privacy & Security</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All data stored locally in your browser session only</li>
            <li>• API keys encrypted and never sent to our servers</li>
            <li>• Direct communication with OpenRouter - no proxy</li>
            <li>• Data automatically cleared when you close the browser</li>
          </ul>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={close}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          >
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  )
}