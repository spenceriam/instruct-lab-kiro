'use client'

import { Question } from 'phosphor-react'

interface HeaderProps {
  onOpenHelp?: () => void
  onResetSession?: () => void
}

export default function Header({ onOpenHelp, onResetSession }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-foreground">
            Instruct-Lab
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2"
            type="button"
          >
            <Question size={16} />
            How does this work?
          </button>
          
          <button
            onClick={onResetSession}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
            type="button"
          >
            Reset Session
          </button>
        </nav>
      </div>
    </header>
  )
}
