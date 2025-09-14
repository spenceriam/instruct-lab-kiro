/**
 * @vitest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InstructionsStep from '../InstructionsStep'

// Mock the store
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn()
}))

const { useAppStore } = await import('@/lib/store')
const mockUseAppStore = useAppStore as any

describe('InstructionsStep', () => {
  const mockSetInstructions = vi.fn()
  const mockSetCurrentStep = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAppStore.mockReturnValue({
      currentTest: {
        instructions: '',
        currentStep: 1
      },
      setInstructions: mockSetInstructions,
      setCurrentStep: mockSetCurrentStep
    })
  })

  it('renders instructions input with character counter', () => {
    render(<InstructionsStep />)
    
    expect(screen.getByText('System Instructions')).toBeInTheDocument()
    expect(screen.getByLabelText('System Instructions *')).toBeInTheDocument()
    expect(screen.getByText('0/4000')).toBeInTheDocument()
  })

  it('shows validation message for short instructions', () => {
    render(<InstructionsStep />)
    
    const textarea = screen.getByLabelText('System Instructions *')
    fireEvent.change(textarea, { target: { value: 'short' } })
    
    expect(screen.getByText('5 more characters needed')).toBeInTheDocument()
  })

  it('enables continue button when instructions are valid', () => {
    render(<InstructionsStep />)
    
    const textarea = screen.getByLabelText('System Instructions *')
    const validInstructions = 'You are a helpful assistant that provides detailed responses.'
    
    fireEvent.change(textarea, { target: { value: validInstructions } })
    
    const continueButton = screen.getByText('Continue to Test')
    expect(continueButton).not.toBeDisabled()
  })

  it('calls setCurrentStep when continue button is clicked', () => {
    render(<InstructionsStep />)
    
    const textarea = screen.getByLabelText('System Instructions *')
    const validInstructions = 'You are a helpful assistant that provides detailed responses.'
    
    fireEvent.change(textarea, { target: { value: validInstructions } })
    
    const continueButton = screen.getByText('Continue to Test')
    fireEvent.click(continueButton)
    
    expect(mockSetCurrentStep).toHaveBeenCalledWith(2)
  })
})