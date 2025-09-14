'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { validateInstructions, getInputClasses, getHelperTextClasses } from '@/lib/validation'

interface InstructionsStepProps {
  onNext?: () => void
  onBack?: () => void
}

export default function InstructionsStep({ onNext, onBack }: InstructionsStepProps) {
  const { currentTest, setInstructions, setCurrentStep } = useAppStore()
  const [instructions, setInstructionsLocal] = useState(currentTest.instructions)
  
  // Validate instructions
  const validation = validateInstructions(instructions)

  // Update store when instructions change
  useEffect(() => {
    setInstructions(instructions)
  }, [instructions, setInstructions])

  const handleNext = () => {
    if (validation.isValid) {
      setCurrentStep(2) // Move to test step
      onNext?.()
    }
  }

  const handleBack = () => {
    setCurrentStep(0) // Back to setup step
    onBack?.()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">System Instructions</h3>
        <p className="text-muted-foreground text-sm">
          Provide clear, detailed instructions that define how the AI should behave and respond.
        </p>
      </div>

      {/* Instructions Input */}
      <div className="space-y-2">
        <label htmlFor="instructions" className="block text-sm font-medium">
          System Instructions *
        </label>
        <div className="relative">
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructionsLocal(e.target.value)}
            placeholder="You are a helpful assistant that..."
            className={`${getInputClasses(validation.status)} min-h-[200px]`}
            rows={8}
          />
          
          {/* Character counter */}
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {instructions.length}/4000
          </div>
        </div>
        
        {/* Helper text */}
        <p className={getHelperTextClasses(validation.status)}>
          {validation.message}
        </p>
      </div>

      {/* Tips */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2">💡 Tips for effective instructions:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Be specific about the desired tone and style</li>
          <li>• Include examples of good responses when possible</li>
          <li>• Specify any constraints or limitations</li>
          <li>• Define the role and context clearly</li>
          <li>• Use clear, unambiguous language</li>
        </ul>
      </div>

      {/* Progress indicator */}
      {validation.isValid && (
        <div className="flex items-center gap-2 pt-4 border-t border-border text-sm text-success">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span>Instructions ready! Click "Test" above to continue.</span>
        </div>
      )}
    </div>
  )
}