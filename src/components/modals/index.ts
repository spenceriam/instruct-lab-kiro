// Lazy-loaded modal components for code splitting
import dynamic from 'next/dynamic'
import React from 'react'

const ModalSkeleton = () => React.createElement('div', {
  className: 'animate-pulse bg-muted rounded-lg h-96'
})

export const HelpModal = dynamic(() => import('./HelpModal'), {
  loading: ModalSkeleton
})

export const PrivacyModal = dynamic(() => import('./PrivacyModal'), {
  loading: ModalSkeleton
})

export const TermsModal = dynamic(() => import('./TermsModal'), {
  loading: ModalSkeleton
})

export const ExportModal = dynamic(() => import('./ExportModal'), {
  loading: ModalSkeleton
})

// Export modal IDs for direct import
export { HELP_MODAL_ID } from './HelpModal'
export { PRIVACY_MODAL_ID } from './PrivacyModal'
export { TERMS_MODAL_ID } from './TermsModal'

// Modal manager
export { modalManager, useModal } from '@/lib/modalManager'