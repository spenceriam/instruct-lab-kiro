'use client'

import React, { useEffect, Suspense, createElement } from 'react'
import Modal from '@/components/ui/Modal'
import { useAppStore } from '@/lib/store'
import { announceToScreenReader } from '@/lib/accessibility'
import dynamic from 'next/dynamic'

// Step skeleton component
const StepSkeleton = () => createElement('div', {
  className: 'animate-pulse bg-muted rounded-lg h-64'
})

// Lazy load step components for better performance
const SetupStep = dynamic(() => import('./SetupStep'), {
  loading: StepSkeleton
})

const InstructionsStep = dynamic(() => import('./InstructionsStep'), {
  loading: StepSkeleton
})

const TestStep = dynamic(() => import('./TestStep'), {
  loading: StepSkeleton
})

const ResultsStep = dynamic(() => import('./ResultsStep'), {
  loading: StepSkeleton
})

interface TestFlowModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StepConfig {
  id: number
  title: string
  description: string
  isAccessible: (currentTest: any, isApiKeyValid: boolean) => boolean
  isComplete: (currentTest: any, isApiKeyValid: boolean) => boolean
}

export default function TestFlowModal({ isOpen, onClose }: TestFlowModalProps) {
  const { currentTest, isApiKeyValid, setCurrentStep } = useAppStore()
  
  const currentStep = currentTest.currentStep || 0
  
  // Step configuration with validation logic
  const stepConfigs: StepConfig[] = [
    {
      id: 0,
      title: 'Setup',
      description: 'Configure API key and select model',
      isAccessible: () => true, // Always accessible
      isComplete: (test, apiValid) => apiValid && !!test.model
    },
    {
      id: 1,
      title: 'Instructions',
      description: 'Define system instructions',
      isAccessible: (test, apiValid) => apiValid && !!test.model,
      isComplete: (test) => !!test.instructions && test.instructions.trim().length >= 10
    },
    {
      id: 2,
      title: 'Test',
      description: 'Run evaluation with test prompt',
      isAccessible: (test, apiValid) => {
        return apiValid && !!test.model && !!test.instructions && test.instructions.trim().length >= 10
      },
      isComplete: (test) => !!test.results && !!test.response
    },
    {
      id: 3,
      title: 'Results',
      description: 'View evaluation results',
      isAccessible: (test) => !!test.results && !!test.response,
      isComplete: () => true // Results step is always complete when accessible
    }
  ]

  // Announce step changes to screen readers
  useEffect(() => {
    if (isOpen) {
      const stepConfig = stepConfigs[currentStep]
      announceToScreenReader(`Now on step ${currentStep + 1} of 4: ${stepConfig.title}. ${stepConfig.description}`)
    }
  }, [currentStep, isOpen])

  // Handle tab navigation with validation
  const handleStepClick = (stepIndex: number) => {
    const targetStep = stepConfigs[stepIndex]
    
    // Check if the step is accessible
    if (targetStep.isAccessible(currentTest, isApiKeyValid)) {
      setCurrentStep(stepIndex)
      announceToScreenReader(`Navigated to ${targetStep.title} step`)
    } else {
      // Announce why the step is not accessible
      const missingRequirements = []
      if (!isApiKeyValid) missingRequirements.push('valid API key')
      if (!currentTest.model) missingRequirements.push('model selection')
      if (!currentTest.instructions || currentTest.instructions.trim().length < 10) {
        missingRequirements.push('system instructions')
      }
      
      announceToScreenReader(
        `Cannot access ${targetStep.title} step. Please complete: ${missingRequirements.join(', ')}`
      )
    }
  }

  const renderCurrentStep = () => {
    return (
      <Suspense fallback={<StepSkeleton />}>
        {(() => {
          switch (currentStep) {
            case 0:
              return <SetupStep />
            case 1:
              return <InstructionsStep />
            case 2:
              return <TestStep />
            case 3:
              return <ResultsStep />
            default:
              return (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Step {currentStep + 1} ({stepConfigs[currentStep]?.title}) - Coming soon
                  </p>
                </div>
              )
          }
        })()}
      </Suspense>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Your Instructions"
      size="lg"
      className="max-w-4xl"
    >
      {/* Step Progress Indicator */}
      <nav className="mb-6" aria-label="Test flow progress">
        <div className="flex items-center justify-between" role="tablist">
          {stepConfigs.map((step, index) => {
            const isAccessible = step.isAccessible(currentTest, isApiKeyValid)
            const isComplete = step.isComplete(currentTest, isApiKeyValid)
            const isCurrent = index === currentStep
            
            return (
              <React.Fragment key={step.title}>
                <div className="flex flex-col items-center">
                  <button
                    id={`step-tab-${index}`}
                    onClick={() => handleStepClick(index)}
                    disabled={!isAccessible}
                    role="tab"
                    aria-selected={isCurrent}
                    aria-controls={`step-panel-${index}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                        : isComplete
                        ? 'bg-success text-white hover:bg-success/90'
                        : isAccessible
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-border'
                        : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed border-2 border-muted'
                    }`}
                    aria-label={`${isAccessible ? 'Go to' : 'Cannot access'} step ${index + 1}: ${step.title}`}
                  >
                    {isComplete && !isCurrent ? '✓' : index + 1}
                  </button>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${
                      isCurrent ? 'text-primary' : isComplete ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                
                {/* Progress connector line */}
                {index < stepConfigs.length - 1 && (
                  <div className="flex-1 mx-4 mt-[-20px]">
                    <div
                      className={`h-0.5 w-full transition-colors ${
                        isComplete ? 'bg-success' : 'bg-muted'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </nav>

      {/* Step validation indicator */}
      {currentStep < 3 && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              stepConfigs[currentStep].isComplete(currentTest, isApiKeyValid) 
                ? 'bg-success' 
                : 'bg-orange-500'
            }`} />
            <span className="text-muted-foreground">
              {stepConfigs[currentStep].isComplete(currentTest, isApiKeyValid)
                ? `${stepConfigs[currentStep].title} step completed`
                : `Complete ${stepConfigs[currentStep].title.toLowerCase()} to continue`
              }
            </span>
          </div>
        </div>
      )}

      {/* Current step content */}
      <div 
        className="min-h-[400px]"
        role="tabpanel"
        id={`step-panel-${currentStep}`}
        aria-labelledby={`step-tab-${currentStep}`}
      >
        {renderCurrentStep()}
      </div>
    </Modal>
  )
}