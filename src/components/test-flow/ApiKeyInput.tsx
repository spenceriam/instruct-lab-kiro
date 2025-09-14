'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeSlash, CheckCircle, XCircle, Spinner } from 'phosphor-react'
import { useAppStore } from '@/lib/store'
import { announceToScreenReader, generateId } from '@/lib/accessibility'

export default function ApiKeyInput() {
  const { apiKey, isApiKeyValid, isLoading, error, setApiKey, clearApiKey } = useAppStore()
  const [inputValue, setInputValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Generate unique IDs for accessibility
  const inputId = generateId('api-key-input')
  const errorId = generateId('api-key-error')
  const successId = generateId('api-key-success')
  const helpId = generateId('api-key-help')

  // Initialize input value from store
  useEffect(() => {
    if (apiKey) {
      setInputValue(apiKey)
    }
  }, [apiKey])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setValidationError(null)
    
    // Clear any existing error when user starts typing
    if (error) {
      // Note: We don't have clearError in the store, so we'll handle this locally
    }
  }

  const handleSubmit = async () => {
    const trimmedValue = inputValue.trim()
    
    if (!trimmedValue) {
      const errorMsg = 'API key is required'
      setValidationError(errorMsg)
      announceToScreenReader(errorMsg, 'assertive')
      return
    }

    if (trimmedValue.length < 20) {
      const errorMsg = 'API key appears to be too short'
      setValidationError(errorMsg)
      announceToScreenReader(errorMsg, 'assertive')
      return
    }

    try {
      announceToScreenReader('Validating API key...')
      await setApiKey(trimmedValue)
      if (isApiKeyValid) {
        announceToScreenReader('API key validated successfully')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to validate API key'
      setValidationError(errorMsg)
      announceToScreenReader(errorMsg, 'assertive')
    }
  }

  const handleClear = async () => {
    setInputValue('')
    setValidationError(null)
    await clearApiKey()
    announceToScreenReader('API key cleared')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const getValidationState = () => {
    if (isLoading) return 'loading'
    if (validationError || error) return 'error'
    if (isApiKeyValid && apiKey) return 'success'
    return 'default'
  }

  const validationState = getValidationState()

  return (
    <div className="space-y-3">
      {/* Input Field */}
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          OpenRouter API Key
        </label>
        <input
          id={inputId}
          type={showKey ? 'text' : 'password'}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="sk-or-..."
          className={`w-full px-4 py-3 pr-20 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors focus-visible-enhanced ${
            validationState === 'error'
              ? 'border-error focus:ring-error'
              : validationState === 'success'
              ? 'border-success focus:ring-success'
              : 'border-input focus:ring-ring'
          }`}
          disabled={isLoading}
          aria-describedby={`${helpId} ${validationError || error ? errorId : ''} ${isApiKeyValid ? successId : ''}`}
          aria-invalid={validationState === 'error'}
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* Toggle visibility button */}
        <button
          type="button"
          onClick={() => {
            setShowKey(!showKey)
            announceToScreenReader(showKey ? 'API key hidden' : 'API key visible')
          }}
          className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible-enhanced"
          disabled={isLoading}
          aria-label={showKey ? 'Hide API key' : 'Show API key'}
        >
          {showKey ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>

        {/* Status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
          {validationState === 'loading' && (
            <Spinner size={18} className="text-muted-foreground animate-spin" />
          )}
          {validationState === 'success' && (
            <CheckCircle size={18} className="text-success" />
          )}
          {validationState === 'error' && (
            <XCircle size={18} className="text-error" />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isLoading || !inputValue.trim() || (isApiKeyValid && inputValue === apiKey)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors text-sm font-medium focus-visible-enhanced"
          type="button"
          aria-describedby={isLoading ? 'validation-status' : undefined}
        >
          {isLoading ? 'Validating...' : isApiKeyValid && inputValue === apiKey ? 'Validated' : 'Validate Key'}
        </button>
        
        {(apiKey || inputValue) && (
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium focus-visible-enhanced"
            type="button"
            aria-label="Clear API key input"
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Loading status for screen readers */}
      {isLoading && (
        <div id="validation-status" className="sr-only" aria-live="polite">
          Validating API key, please wait...
        </div>
      )}

      {/* Error Message */}
      {(validationError || error) && (
        <div 
          id={errorId}
          className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <XCircle size={16} className="text-error mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="text-sm text-error">
            {validationError || error}
          </div>
        </div>
      )}

      {/* Success Message */}
      {isApiKeyValid && !validationError && !error && (
        <div 
          id={successId}
          className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-md"
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={16} className="text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="text-sm text-success">
            API key validated successfully. You can now select a model.
          </div>
        </div>
      )}

      {/* Help Text */}
      <div id={helpId} className="text-xs text-muted-foreground">
        <p>
          Don&apos;t have an OpenRouter API key?{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline focus-visible-enhanced"
            aria-label="Get OpenRouter API key (opens in new tab)"
          >
            Get one here
          </a>
        </p>
      </div>
    </div>
  )
}