'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import Hero from '@/components/Hero'
import FeatureGrid from '@/components/FeatureGrid'
import TestHistory from '@/components/TestHistory'
import { TestFlowModal } from '@/components/test-flow'
import { useAppStore } from '@/lib/store'
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
  const [isTestFlowOpen, setIsTestFlowOpen] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const { testHistory, startTest, clearHistory } = useAppStore()

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
    startTest() // Initialize test state
    setIsTestFlowOpen(true)
  }

  const handleCloseTestFlow = () => {
    setIsTestFlowOpen(false)
  }

  const handleClearHistory = async () => {
    setIsHistoryLoading(true)
    try {
      await clearHistory()
    } catch (error) {
      console.error('Failed to clear history:', error)
    } finally {
      setIsHistoryLoading(false)
    }
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
        testRuns={testHistory}
        onStartTesting={handleStartTesting}
        onClearHistory={handleClearHistory}
        isLoading={isHistoryLoading}
      />
      
      {/* Modal Components */}
      <TestFlowModal 
        isOpen={isTestFlowOpen}
        onClose={handleCloseTestFlow}
      />
      <HelpModal />
      <PrivacyModal />
      <TermsModal />
    </Layout>
  )
}
