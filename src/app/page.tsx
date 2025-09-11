'use client'

import Layout from '@/components/Layout'

export default function Home() {
  const handleOpenHelp = () => {
    console.log('Open help modal')
    // TODO: Implement help modal
  }

  const handleResetSession = () => {
    console.log('Reset session')
    // TODO: Implement session reset
  }

  const handleOpenPrivacy = () => {
    console.log('Open privacy modal')
    // TODO: Implement privacy modal
  }

  const handleOpenTerms = () => {
    console.log('Open terms modal')
    // TODO: Implement terms modal
  }

  return (
    <Layout
      onOpenHelp={handleOpenHelp}
      onResetSession={handleResetSession}
      onOpenPrivacy={handleOpenPrivacy}
      onOpenTerms={handleOpenTerms}
    >
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Test Your AI System Instructions
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Evaluate instruction effectiveness across multiple models with quantitative metrics
        </p>
        
        {/* Status Card */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-custom-md">
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
              <p className="text-sm font-medium text-foreground">
                Application Shell Ready
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Next.js 14 setup complete with layout components, header, footer, and design system.
            </p>
          </div>
        </div>
        
        {/* Preview of upcoming features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-2">Model Selection</h3>
            <p className="text-sm text-muted-foreground">Search and select from OpenRouter&apos;s model registry</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-2">Dual Evaluation</h3>
            <p className="text-sm text-muted-foreground">Test with your model, evaluate with GPT-4</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-2">Quantitative Metrics</h3>
            <p className="text-sm text-muted-foreground">Get success probability scores and detailed analysis</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
