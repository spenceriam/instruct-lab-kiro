'use client'

import Modal from '@/components/ui/Modal'
import { useModal } from '@/lib/modalManager'

export const TERMS_MODAL_ID = 'terms-modal'

export default function TermsModal() {
  const { isOpen, close } = useModal(TERMS_MODAL_ID)

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Terms of Use"
      size="lg"
    >
      <div className="space-y-6 max-h-96 overflow-y-auto">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>Last updated:</strong> September 2025
          </p>
          <p className="text-muted-foreground">
            By using Instruct-Lab, you agree to these terms of use. Please read them carefully.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Service Description
          </h3>
          <p className="text-sm text-muted-foreground">
            Instruct-Lab is a web application that helps you test and evaluate AI system instructions across multiple models using OpenRouter&apos;s API. This is a demonstration project built by Spencer.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Your Responsibilities
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You must provide your own valid OpenRouter API key</p>
            <p>• You are responsible for all costs incurred through OpenRouter API usage</p>
            <p>• You must comply with OpenRouter&apos;s terms of service and usage policies</p>
            <p>• You must not use the service for illegal or harmful purposes</p>
            <p>• You must not attempt to reverse engineer or exploit the service</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Service Limitations
          </h3>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="space-y-2 text-sm text-foreground">
              <p><strong>Demonstration Project:</strong> This is a demonstration project with no guarantees of availability, accuracy, or continued operation.</p>
              <p><strong>No SLA:</strong> We provide no service level agreements or uptime guarantees.</p>
              <p><strong>Beta Software:</strong> Features may be incomplete or change without notice.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Disclaimers
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• The service is provided &quot;as-is&quot; without any warranties</p>
            <p>• We are not responsible for the accuracy of AI-generated evaluations</p>
            <p>• We are not liable for any costs incurred through third-party API usage</p>
            <p>• Use of this service does not guarantee improved AI performance</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Data & Privacy
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• All data is stored locally in your browser session</p>
            <p>• We do not collect, store, or transmit your personal data</p>
            <p>• Your API keys and content are your responsibility to protect</p>
            <p>• See our Privacy Policy for detailed information</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Intellectual Property
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You retain all rights to your system instructions and prompts</p>
            <p>• The Instruct-Lab interface and code are provided for demonstration</p>
            <p>• Third-party services (OpenRouter, AI models) have their own terms</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Termination
          </h3>
          <p className="text-sm text-muted-foreground">
            You may stop using the service at any time. We may discontinue the service at any time without notice, as this is a demonstration project.
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            These terms are designed for a demonstration project. For questions or concerns, please reach out to [@spencer_i_am](https://x.com/spencer_i_am) on X.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={close}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}