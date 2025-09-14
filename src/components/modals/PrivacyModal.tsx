'use client'

import Modal from '@/components/ui/Modal'
import { useModal } from '@/lib/modalManager'

export const PRIVACY_MODAL_ID = 'privacy-modal'

export default function PrivacyModal() {
  const { isOpen, close } = useModal(PRIVACY_MODAL_ID)

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Privacy Policy"
      size="lg"
    >
      <div className="space-y-6 max-h-96 overflow-y-auto">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>Last updated:</strong> September 2025
          </p>
          <p className="text-muted-foreground">
            Instruct-Lab is committed to protecting your privacy. This policy explains how we handle your data when you use our AI system instruction testing platform.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Data Collection & Storage
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
              <p><strong>Local Storage Only:</strong> All your data (API keys, test results, session history) is stored locally in your browser using sessionStorage. Nothing is sent to or stored on our servers.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
              <p><strong>Automatic Deletion:</strong> All data is automatically deleted when you close your browser or the session expires.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
              <p><strong>API Key Encryption:</strong> Your OpenRouter API keys are encrypted using the Web Crypto API before being stored in sessionStorage.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Third-Party Services
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
              <p><strong>OpenRouter:</strong> When you run evaluations, your system instructions and prompts are sent directly to OpenRouter&apos;s API using your API key. We do not proxy or intercept this communication.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
              <p><strong>Vercel Hosting:</strong> This application is hosted on Vercel. Standard web server logs may be collected by Vercel according to their privacy policy.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Analytics & Tracking
          </h3>
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>No Analytics:</strong> We do not use Google Analytics, tracking cookies, or any other analytics services. Your usage is completely private.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Data Security
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• All connections use HTTPS encryption</p>
            <p>• API keys are encrypted using browser-native Web Crypto API</p>
            <p>• No server-side data storage or logging of user content</p>
            <p>• Session data isolated per browser session</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Your Rights
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You can clear all data at any time using the &quot;Reset Session&quot; button</p>
            <p>• You can export your test results and history at any time</p>
            <p>• You have complete control over your API keys and can remove them at any time</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Questions about this privacy policy? For any concerns, please reach out to [@spencer_i_am](https://x.com/spencer_i_am) on X.
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