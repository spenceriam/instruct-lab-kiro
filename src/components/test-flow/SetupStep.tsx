'use client'

import React, { useState } from 'react'
import ApiKeyInput from './ApiKeyInput'
import ModelSearch from './ModelSearch'
import SelectedModelDisplay from './SelectedModelDisplay'
import { useAppStore } from '@/lib/store'
import { ArrowRight } from 'phosphor-react'

export default function SetupStep() {
  const { currentTest, settings, isApiKeyValid, setCurrentStep } = useAppStore()
  const [showModelSearch, setShowModelSearch] = useState(false)
  const [showEvaluationModelSearch, setShowEvaluationModelSearch] = useState(false)

  const canProceed = isApiKeyValid && currentTest.model && settings.evaluationModel

  const handleNext = () => {
    if (canProceed) {
      setCurrentStep(1) // Move to instructions step
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* API Key Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          OpenRouter API Key
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          Enter your OpenRouter API key to access AI models. Your key is encrypted and stored only in your browser session.
        </p>
        <ApiKeyInput />
      </div>

      {/* Model Selection Section */}
      {isApiKeyValid && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
            Select Model
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            Choose the AI model you want to test your instructions with.
          </p>
          
          {currentTest.model ? (
            <SelectedModelDisplay 
              model={currentTest.model}
              onChangeModel={() => setShowModelSearch(true)}
            />
          ) : (
            <button
              onClick={() => setShowModelSearch(true)}
              className="w-full p-3 sm:p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-foreground transition-colors text-sm sm:text-base min-h-[44px]"
            >
              Click to search and select a model
            </button>
          )}

          {showModelSearch && (
            <div className="mt-3 sm:mt-4">
              <ModelSearch onClose={() => setShowModelSearch(false)} />
            </div>
          )}
        </div>
      )}

      {/* Evaluation Model Selection Section */}
      {isApiKeyValid && currentTest.model && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
            Select Evaluation Model
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            Choose the AI model that will evaluate and score the primary model's responses.
          </p>
          
          {settings.evaluationModel ? (
            <SelectedModelDisplay 
              model={settings.evaluationModel}
              onChangeModel={() => setShowEvaluationModelSearch(true)}
            />
          ) : (
            <button
              onClick={() => setShowEvaluationModelSearch(true)}
              className="w-full p-3 sm:p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-foreground transition-colors text-sm sm:text-base min-h-[44px]"
            >
              Click to search and select an evaluation model
            </button>
          )}

          {showEvaluationModelSearch && (
            <div className="mt-3 sm:mt-4">
              <ModelSearch 
                onClose={() => setShowEvaluationModelSearch(false)}
                isEvaluationModel={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Progress indicator */}
      {canProceed && (
        <div className="flex items-center gap-2 pt-3 sm:pt-4 border-t border-border text-sm text-success">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span>Setup complete! Click "Instructions" above to continue.</span>
        </div>
      )}
    </div>
  )
}