'use client'

import Layout from '@/components/Layout'
import Hero from '@/components/Hero'
import FeatureGrid from '@/components/FeatureGrid'
import TestHistory from '@/components/TestHistory'
import {
  HelpModal,
  PrivacyModal,
  TermsModal,
  modalManager,
  HELP_MODAL_ID,
  PRIVACY_MODAL_ID,
  TERMS_MODAL_ID
} from '@/components/modals'

export default function Home() {
  const handleOpenHelp = () => {
    modalManager.open(HELP_MODAL_ID)
  }

  const handleResetSession = () => {
    // TODO: Implement session reset functionality
    console.log('Reset session')
  }

  const handleOpenPrivacy = () => {
    modalManager.open(PRIVACY_MODAL_ID)
  }

  const handleOpenTerms = () => {
    modalManager.open(TERMS_MODAL_ID)
  }

  const handleStartTesting = () => {
    // TODO: Open test flow modal when implemented
    console.log('Start testing flow')
  }

  return (
    <Layout
      onOpenHelp={handleOpenHelp}
      onResetSession={handleResetSession}
      onOpenPrivacy={handleOpenPrivacy}
      onOpenTerms={handleOpenTerms}
    >
      {/* Hero Section */}
      <Hero onStartTesting={handleStartTesting} />
      
      {/* Features Grid */}
      <FeatureGrid />
      
      {/* Test History */}
      <TestHistory 
        testRuns={[]} // Empty for now, will be populated by state management
        onStartTesting={handleStartTesting}
        onClearHistory={() => console.log('Clear history')}
      />
      
      {/* Modal Components */}
      <HelpModal />
      <PrivacyModal />
      <TermsModal />
    </Layout>
  )
}
