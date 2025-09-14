'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import SkipNavigation from './SkipNavigation'
import dynamic from 'next/dynamic'

// Lazy load performance debugger for development
const PerformanceDebugger = dynamic(() => import('./dev/PerformanceDebugger'), {
  ssr: false
})

interface LayoutProps {
  children: ReactNode
  onOpenHelp?: () => void
  onResetSession?: () => void
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
}

export default function Layout({
  children,
  onOpenHelp,
  onResetSession,
  onOpenPrivacy,
  onOpenTerms
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SkipNavigation />
      
      <Header
        onOpenHelp={onOpenHelp}
        onResetSession={onResetSession}
      />
      
      <main 
        id="main-content"
        className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
        role="main"
        tabIndex={-1}
      >
        {children}
      </main>
      
      <Footer
        onOpenPrivacy={onOpenPrivacy}
        onOpenTerms={onOpenTerms}
      />
      
      {/* Performance debugger for development */}
      <PerformanceDebugger />
    </div>
  )
}
