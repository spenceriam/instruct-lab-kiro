'use client'

import { PlayCircle } from 'phosphor-react'

interface HeroProps {
  onStartTesting?: () => void
}

export default function Hero({ onStartTesting }: HeroProps) {
  return (
    <section className="text-center py-16 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Test Your AI{' '}
          <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            System Instructions
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Evaluate instruction effectiveness across multiple models with{' '}
          <span className="text-foreground font-medium">quantitative metrics</span>{' '}
          and get actionable insights to optimize your AI interactions.
        </p>

        {/* Key Benefits */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-muted-foreground">Model-Agnostic Testing</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span className="text-muted-foreground">Quantitative Evaluation</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-error rounded-full"></div>
            <span className="text-muted-foreground">Privacy-First</span>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onStartTesting}
            className="inline-flex items-center justify-center rounded-md text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 gap-3 shadow-custom-md hover:shadow-custom-lg transition-shadow"
          >
            <PlayCircle size={24} />
            Start Testing
          </button>
          
          <div className="text-sm text-muted-foreground">
            No signup required • Session-only storage
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">4</div>
            <div className="text-sm text-muted-foreground">Evaluation Metrics</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">100+</div>
            <div className="text-sm text-muted-foreground">OpenRouter Models</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">0%</div>
            <div className="text-sm text-muted-foreground">Data Retention</div>
          </div>
        </div>
      </div>
    </section>
  )
}