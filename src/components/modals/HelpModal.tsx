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
      size="xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <h3 className="text-base font-semibold text-foreground mb-2">
            Dual-Model Evaluation Process
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Instruct-Lab uses a sophisticated two-step process to quantitatively evaluate your AI system instructions:
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                1
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm mb-1">Primary Execution</h4>
              <p className="text-xs text-muted-foreground">
                Your selected AI model executes your system instructions with your test prompt, generating a response.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                2
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm mb-1">Evaluation Analysis</h4>
              <p className="text-xs text-muted-foreground">
                Your evaluation model analyzes the response against your original instructions and prompt, scoring effectiveness across multiple dimensions.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Evaluation Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex gap-2 p-2 border border-border rounded-lg">
              <CheckCircle size={16} className="text-success flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-xs">Coherence (20%)</h4>
                <p className="text-xs text-muted-foreground">Logical structure and clarity of response</p>
              </div>
            </div>

            <div className="flex gap-2 p-2 border border-border rounded-lg">
              <Target size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-xs">Task Completion (35%)</h4>
                <p className="text-xs text-muted-foreground">How fully the response addresses the prompt</p>
              </div>
            </div>

            <div className="flex gap-2 p-2 border border-border rounded-lg">
              <FileText size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-xs">Instruction Adherence (35%)</h4>
                <p className="text-xs text-muted-foreground">Following your system instructions precisely</p>
              </div>
            </div>

            <div className="flex gap-2 p-2 border border-border rounded-lg">
              <Lightning size={16} className="text-error flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-xs">Efficiency (10%)</h4>
                <p className="text-xs text-muted-foreground">Conciseness while remaining complete</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 text-sm mb-2">Privacy & Security</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• All data stored locally in your browser session only</li>
            <li>• API keys encrypted and never sent to our servers</li>
            <li>• Direct communication with OpenRouter - no proxy</li>
            <li>• Data automatically cleared when you close the browser</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={close}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
        >
          Got it!
        </button>
      </div>
    </Modal>
  )
}