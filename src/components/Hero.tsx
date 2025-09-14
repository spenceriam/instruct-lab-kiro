'use client'

import { PlayCircle } from 'phosphor-react'

interface HeroProps {
  onStartTesting?: () => void
}

export default function Hero({ onStartTesting }: HeroProps) {
  return (
    <section 
      className="text-center py-8 sm:py-12 lg:py-16 animate-fade-in px-4"
      role="banner"
      aria-labelledby="hero-title"
    >
      <div className="max-w-4xl mx-auto">
        {/* Main Headline */}
        <h1 
          id="hero-title"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight"
        >
          Test Your AI{' '}
          <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            System Instructions
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
          Evaluate instruction effectiveness across multiple models with{' '}
          <span className="text-foreground font-medium">quantitative metrics</span>{' '}
          and get actionable insights to optimize your AI interactions.
        </p>

        {/* Key Benefits */}
        <div 
          className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-10 text-xs sm:text-sm px-2"
          role="list"
          aria-label="Key features"
        >
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 sm:px-4 py-2" role="listitem">
            <div className="w-2 h-2 bg-success rounded-full flex-shrink-0" aria-hidden="true"></div>
            <span className="text-muted-foreground whitespace-nowrap">Model-Agnostic Testing</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 sm:px-4 py-2" role="listitem">
            <div className="w-2 h-2 bg-warning rounded-full flex-shrink-0" aria-hidden="true"></div>
            <span className="text-muted-foreground whitespace-nowrap">Quantitative Evaluation</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 sm:px-4 py-2" role="listitem">
            <div className="w-2 h-2 bg-error rounded-full flex-shrink-0" aria-hidden="true"></div>
            <span className="text-muted-foreground whitespace-nowrap">Privacy-First</span>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 lg:mb-16">
          <button
            onClick={onStartTesting}
            className="inline-flex items-center justify-center rounded-md text-base sm:text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 sm:h-14 px-6 sm:px-8 gap-2 sm:gap-3 shadow-custom-md hover:shadow-custom-lg transition-shadow w-full sm:w-auto max-w-xs focus-visible-enhanced"
            type="button"
            aria-describedby="cta-description"
          >
            <PlayCircle size={20} className="sm:hidden" aria-hidden="true" />
            <PlayCircle size={24} className="hidden sm:block" aria-hidden="true" />
            Start Testing
          </button>
          
          <div 
            id="cta-description"
            className="text-xs sm:text-sm text-muted-foreground text-center"
          >
            No signup required • Session-only storage
          </div>
        </div>

        {/* Stats Preview */}
        <div 
          className="grid grid-cols-3 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-2xl mx-auto"
          role="region"
          aria-label="Platform statistics"
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2" aria-label="4 evaluation metrics">4</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Evaluation Metrics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2" aria-label="Over 100 OpenRouter models">100+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">OpenRouter Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2" aria-label="Zero percent data retention">0%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Data Retention</div>
          </div>
        </div>
      </div>
    </section>
  )
}