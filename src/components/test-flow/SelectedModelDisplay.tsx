'use client'

import { Model } from '@/lib/types'
import { Swap, Info } from 'phosphor-react'

interface SelectedModelDisplayProps {
  model: Model
  onChangeModel: () => void
}

export default function SelectedModelDisplay({ model, onChangeModel }: SelectedModelDisplayProps) {
  const formatPrice = (price: number, type: 'input' | 'output') => {
    const safePrice = price || 0
    if (safePrice === 0) {
      return `$0/M ${type} tokens`
    }
    
    // The API returns prices per token, so multiply by 1,000,000 to get per million tokens
    const pricePerMillion = safePrice * 1000000
    
    // Format with appropriate decimal places
    if (pricePerMillion < 1) {
      return `$${pricePerMillion.toFixed(3)}/M ${type} tokens`
    }
    return `$${pricePerMillion.toFixed(2)}/M ${type} tokens`
  }

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'OpenAI': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Anthropic': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Google': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Meta': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Mistral': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    return colors[provider] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className="border border-border rounded-lg bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground truncate">
              {model.name}
            </h4>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getProviderColor(model.provider)}`}>
              {model.provider}
            </span>
          </div>
          
          {model.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {model.description}
            </p>
          )}
        </div>
        
        <button
          onClick={onChangeModel}
          className="ml-3 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors"
        >
          <Swap size={14} />
          Change
        </button>
      </div>

      {/* Model Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-md">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Context Length</div>
          <div className="text-sm font-medium text-foreground">
            {(model.contextLength || 0).toLocaleString()} tokens
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Input Price</div>
          <div className="text-sm font-medium text-foreground">
            {formatPrice(model.pricing?.prompt || 0, 'input')}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Output Price</div>
          <div className="text-sm font-medium text-foreground">
            {formatPrice(model.pricing?.completion || 0, 'output')}
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
        <Info size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          This model will be used to generate responses based on your system instructions and test prompt.
        </p>
      </div>
    </div>
  )
}