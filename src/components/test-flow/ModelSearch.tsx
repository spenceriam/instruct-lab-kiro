'use client'

import { useState, useEffect, useMemo } from 'react'
import { MagnifyingGlass, Spinner, X } from 'phosphor-react'
import { useAppStore } from '@/lib/store'
import { Model } from '@/lib/types'
import { useDebounce } from '@/lib/utils'
import { announceToScreenReader, generateId } from '@/lib/accessibility'
import { ModelSearchSkeleton } from '@/components/ui/LoadingStates'

interface ModelSearchProps {
  onClose: () => void
  isEvaluationModel?: boolean
}

export default function ModelSearch({ onClose, isEvaluationModel = false }: ModelSearchProps) {
  const { availableModels, isLoading, fetchModels, searchModels, selectModel, selectEvaluationModel } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  // Removed focusedIndex to prevent keyboard navigation interference
  
  // Generate unique IDs for accessibility
  const searchId = generateId('model-search')
  const listboxId = generateId('model-listbox')
  const statusId = generateId('search-status')
  
  // Debounce search query to avoid excessive filtering
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch models on component mount
  useEffect(() => {
    if (availableModels.length === 0) {
      fetchModels()
    }
  }, [availableModels.length, fetchModels])

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return availableModels
    }
    return searchModels(debouncedQuery)
  }, [availableModels, debouncedQuery, searchModels])

  // Show searching state when debounced query changes
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
      // Announce search results
      if (debouncedQuery) {
        announceToScreenReader(`Found ${filteredModels.length} models matching "${debouncedQuery}"`)
      }
    }
  }, [searchQuery, debouncedQuery])

  // Removed focus management to prevent interference

  const handleModelSelect = (model: Model) => {
    if (isEvaluationModel) {
      selectEvaluationModel(model)
      announceToScreenReader(`Selected evaluation model: ${model.name} by ${model.provider}`)
    } else {
      selectModel(model)
      announceToScreenReader(`Selected model: ${model.name} by ${model.provider}`)
    }
    onClose()
  }

  // Removed keyboard navigation to prevent interference with typing

  const formatPrice = (price: number) => {
    return `$${(price || 0).toFixed(4)}/1K tokens`
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
    <div className="border border-border rounded-lg bg-card" role="dialog" aria-labelledby="model-search-title">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h4 id="model-search-title" className="font-semibold text-foreground">Select Model</h4>
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible-enhanced"
          aria-label="Close model selection"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search models by name, provider, or description
          </label>
          <MagnifyingGlass 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}

            placeholder="Search models by name, provider, or description..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus-visible-enhanced"
            aria-describedby={statusId}
            aria-expanded="true"
            aria-controls={listboxId}
            role="combobox"
            aria-autocomplete="list"
            autoComplete="off"
          />
          {(isSearching || isLoading) && (
            <Spinner 
              size={18} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" 
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* Models List */}
      <div 
        id={listboxId}
        className="max-h-96 overflow-y-auto"
        role="listbox"
        aria-label="Available models"
      >
        {isLoading && availableModels.length === 0 ? (
          <ModelSearchSkeleton />
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
            {searchQuery ? 'No models found matching your search.' : 'No models available.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredModels.map((model, index) => (
              <button
                key={model.id}
                data-model-button
                onClick={() => handleModelSelect(model)}
                className="w-full p-4 text-left hover:bg-accent transition-colors focus:outline-none focus:bg-accent focus-visible-enhanced"
                role="option"
                aria-selected={false}
                aria-describedby={`model-${model.id}-details`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-foreground truncate">
                        {model.name}
                      </h5>
                      <span 
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getProviderColor(model.provider)}`}
                        aria-label={`Provider: ${model.provider}`}
                      >
                        {model.provider}
                      </span>
                    </div>
                    
                    {model.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {model.description}
                      </p>
                    )}
                    
                    <div 
                      id={`model-${model.id}-details`}
                      className="flex items-center gap-4 text-xs text-muted-foreground"
                    >
                      <span aria-label={`Context length: ${(model.contextLength || 0).toLocaleString()} tokens`}>
                        Context: {(model.contextLength || 0).toLocaleString()} tokens
                      </span>
                      <span aria-label={`Input price: ${formatPrice(model.pricing?.prompt || 0)}`}>
                        Input: {formatPrice(model.pricing?.prompt || 0)}
                      </span>
                      <span aria-label={`Output price: ${formatPrice(model.pricing?.completion || 0)}`}>
                        Output: {formatPrice(model.pricing?.completion || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <p 
          id={statusId}
          className="text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Showing {filteredModels.length} of {availableModels.length} available models
        </p>
      </div>
    </div>
  )
}