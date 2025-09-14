'use client'

import { Question } from 'phosphor-react'

interface HeaderProps {
  onOpenHelp?: () => void
  onResetSession?: () => void
}

export default function Header({ onOpenHelp, onResetSession }: HeaderProps) {
  return (
    <header 
      className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      role="banner"
    >
      <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            Instruct-Lab
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2" role="navigation" aria-label="Main navigation">
          <button
            onClick={onOpenHelp}
            className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-2 focus-visible-enhanced"
            type="button"
            aria-label="Open help and documentation"
          >
            <Question size={16} aria-hidden="true" />
            <span className="hidden sm:inline">How does this work?</span>
            <span className="sm:hidden">Help</span>
          </button>
          
          <button
            onClick={onResetSession}
            className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 sm:h-9 px-2 sm:px-3 focus-visible-enhanced"
            type="button"
            aria-label="Reset current session and clear all data"
          >
            <span className="hidden sm:inline">Reset Session</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
