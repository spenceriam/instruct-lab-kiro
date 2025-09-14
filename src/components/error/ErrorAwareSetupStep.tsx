'use client'

import { useState, useEffect } from 'react'
import ApiKeyInput from '../test-flow/ApiKeyInput'
import ModelSearch from '../test-flow/ModelSearch'
import SelectedModelDisplay from '../test-flow/SelectedModelDisplay'
import { useAppStore } from '@/lib/store'
import { ArrowRight } from 'phosphor-react'
import ErrorBoundary from './ErrorBoundary'
import ApiErrorDisplay from './ApiErrorDisplay'
import { AppError, ErrorRecoveryManager } from '@/lib/errorHandling'
import { openRouterService } from '@/services/openRouterService'

/**
 * Enhanced SetupStep component with comprehensive error handling
 */
export default function ErrorAwareSetupStep() {
  const { 
    currentTest, 
    isApiKeyValid, 
    apiKey,
    setCurrentStep, 
    setApiKey,
    clearError,
    error
  } = useAppStore()
  
  const [showModelSearch, setShowModelSearch] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<AppError | null>(null)
  const [modelError, setModelError] = useState<AppError | null>(null)
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [isFetchingModels, setIsFetchingModels] = useState(false)

  const canProceed = isApiKeyValid && currentTest.model

  // Handle API key validation with error recovery
  const handleApiKeySubmit = async (key: string) => {
    const operationId = 'api_key_validation'
    
    setIsValidatingKey(true)
    setApiKeyError(null)
    
    try {
      // Preserve the key for recovery
      ErrorRecoveryManager.preserveUserInput(operationId, { apiKey: key })
      
      // Validate the key
      const isValid = await openRouterService.validateApiKey(key)
      
      if (isValid) {
        await setApiKey(key)
        ErrorRecoveryManager.clearRecoveryState(operationId)
      } else {
        throw new Error('Invalid API key. Please check your OpenRouter API key.')
      }
    } catch (error) {
      console.error('API key validation failed:', error)
      
      const appError = error as AppError
      appError.context = {
        ...appError.context,
        operation: 'apiKeyValidation',
        keyLength: key.length
      }
      
      setApiKeyError(appError)
      ErrorRecoveryManager.updateRetryCount(operationId)
    } finally {
      setIsValidatingKey(false)
    }
  }

  // Handle model fetching with error recovery
  const handleModelSearch = async () => {
    if (!apiKey) return
    
    const operationId = 'model_fetch'
    
    setIsFetchingModels(true)
    setModelError(null)
    
    try {
      // Preserve context for recovery
      ErrorRecoveryManager.preserveUserInput(operationId, { 
        apiKey,
        timestamp: Date.now()
      })
      
      // Fetch models (this will be handled by the ModelSearch component)
      setShowModelSearch(true)
      ErrorRecoveryManager.clearRecoveryState(operationId)
    } catch (error) {
      console.error('Model fetch failed:', error)
      
      const appError = error as AppError
      appError.context = {
        ...appError.context,
        operation: 'modelFetch'
      }
      
      setModelError(appError)
      ErrorRecoveryManager.updateRetryCount(operationId)
    } finally {
      setIsFetchingModels(false)
    }
  }

  // Retry API key validation
  const handleRetryApiKey = async () => {
    const operationId = 'api_key_validation'
    const recoveredData = ErrorRecoveryManager.restoreUserInput(operationId)
    
    if (recoveredData?.apiKey) {
      await handleApiKeySubmit(recoveredData.apiKey)
    }
  }

  // Retry model fetching
  const handleRetryModels = async () => {
    await handleModelSearch()
  }

  const handleNext = () => {
    if (canProceed) {
      clearError()
      setApiKeyError(null)
      setModelError(null)
      setCurrentStep(1) // Move to instructions step
    }
  }

  const handleErrorDismiss = () => {
    setApiKeyError(null)
    setModelError(null)
    clearError()
  }

  // Restore user input on component mount
  useEffect(() => {
    const apiKeyOperationId = 'api_key_validation'
    const recoveredApiKeyData = ErrorRecoveryManager.restoreUserInput(apiKeyOperationId)
    
    if (recoveredApiKeyData?.apiKey && !apiKey) {
      // Show that we have recovered data
      setApiKeyError({
        type: 'validation',
        message: 'Previous API key validation failed. Please try again.',
        retryable: true,
        timestamp: Date.now(),
        context: { recovered: true }
      })
    }
  }, [])

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Setup step error boundary:', error)
        if (error.context?.operation === 'apiKeyValidation') {
          setApiKeyError(error)
        } else {
          setModelError(error)
        }
      }}
      resetKeys={[apiKey, currentTest.model?.id].filter(Boolean) as (string | number)[]}
    >
      <div className="space-y-6">
        {/* Global Error Display */}
        {(error || apiKeyError || modelError) && (
          <ApiErrorDisplay
            error={apiKeyError || modelError || (error ? {
              type: 'api',
              message: error,
              retryable: true,
              timestamp: Date.now()
            } : null)}
            onRetry={apiKeyError ? handleRetryApiKey : handleRetryModels}
            onDismiss={handleErrorDismiss}
            autoRetry={false} // Manual retry for setup steps
            preserveInput={true}
          />
        )}

        {/* API Key Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            OpenRouter API Key
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your OpenRouter API key to access AI models. Your key is encrypted and stored only in your browser session.
          </p>
          
          <div className="relative">
            <ApiKeyInput 
              onSubmit={handleApiKeySubmit}
              disabled={isValidatingKey}
              error={apiKeyError?.message}
            />
            
            {/* Validation Loading State */}
            {isValidatingKey && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Validating API key...
              </div>
            )}
          </div>
        </div>

        {/* Model Selection Section */}
        {isApiKeyValid && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Select Model
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the AI model you want to test your instructions with.
            </p>
            
            {currentTest.model ? (
              <SelectedModelDisplay 
                model={currentTest.model}
                onChangeModel={() => setShowModelSearch(true)}
              />
            ) : (
              <button
                onClick={handleModelSearch}
                disabled={isFetchingModels}
                className="w-full p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingModels ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading models...
                  </div>
                ) : (
                  'Click to search and select a model'
                )}
              </button>
            )}

            {showModelSearch && (
              <div className="mt-4">
                <ModelSearch 
                  onClose={() => setShowModelSearch(false)}
                  onError={(error) => setModelError(error)}
                />
              </div>
            )}
          </div>
        )}

        {/* Connection Status */}
        {isApiKeyValid && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Connected to OpenRouter API
              </span>
            </div>
          </div>
        )}

        {/* Next Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={handleNext}
            disabled={!canProceed || isValidatingKey || isFetchingModels}
            className={`inline-flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
              canProceed && !isValidatingKey && !isFetchingModels
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            Next: Instructions
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Recovery Information */}
        {(apiKeyError?.context?.recovered || modelError?.context?.recovered) && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💾 We&apos;ve recovered your previous input. Please review and try again.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}