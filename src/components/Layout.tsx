'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

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
      <Header
        onOpenHelp={onOpenHelp}
        onResetSession={onResetSession}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      
      <Footer
        onOpenPrivacy={onOpenPrivacy}
        onOpenTerms={onOpenTerms}
      />
    </div>
  )
}
