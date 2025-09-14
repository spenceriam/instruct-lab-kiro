'use client'

import { 
  Brain, 
  ChartLineUp, 
  ShieldCheck, 
  Lightning, 
  Globe, 
  DownloadSimple 
} from 'phosphor-react'

export default function FeatureGrid() {
  const features = [
    {
      icon: Brain,
      title: 'Dual-Model Evaluation',
      description: 'Your model executes instructions, GPT-4 evaluates effectiveness with quantitative scoring.',
      color: 'text-blue-600'
    },
    {
      icon: ChartLineUp,
      title: 'Quantitative Metrics',
      description: 'Get precise scores for coherence, task completion, instruction adherence, and efficiency.',
      color: 'text-green-600'
    },
    {
      icon: Globe,
      title: 'Model-Agnostic Testing',
      description: 'Test across 100+ models via OpenRouter - OpenAI, Anthropic, Google, and more.',
      color: 'text-purple-600'
    },
    {
      icon: ShieldCheck,
      title: 'Privacy-First Design',
      description: 'All data stored locally in your browser. API keys encrypted, never sent to our servers.',
      color: 'text-emerald-600'
    },
    {
      icon: Lightning,
      title: 'Real-Time Testing',
      description: 'Test, evaluate, and iterate on your instructions in real-time with immediate feedback.',
      color: 'text-orange-600'
    },
    {
      icon: DownloadSimple,
      title: 'Export & Share',
      description: 'Export test results in multiple formats (JSON, CSV, PDF) for documentation and sharing.',
      color: 'text-pink-600'
    }
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Why Choose Instruct-Lab?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Stop guessing about your AI instructions. Get scientific, quantitative feedback 
            to optimize your prompts and improve AI performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-custom-md transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-lg bg-muted/50 ${feature.color} flex-shrink-0`}>
                  <feature.icon size={20} className="sm:hidden" />
                  <feature.icon size={24} className="hidden sm:block" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-custom-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
              Ready to optimize your AI instructions?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
              Start testing with your OpenRouter API key. No account creation required.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <ShieldCheck size={14} className="sm:hidden text-success flex-shrink-0" />
                <ShieldCheck size={16} className="hidden sm:block text-success flex-shrink-0" />
                <span>No data collection</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Lightning size={14} className="sm:hidden text-warning flex-shrink-0" />
                <Lightning size={16} className="hidden sm:block text-warning flex-shrink-0" />
                <span>Instant results</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Globe size={14} className="sm:hidden text-primary flex-shrink-0" />
                <Globe size={16} className="hidden sm:block text-primary flex-shrink-0" />
                <span>100+ models supported</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}