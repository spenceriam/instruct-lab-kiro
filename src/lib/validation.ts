// Validation utilities for form inputs

export interface ValidationResult {
  isValid: boolean
  status: 'neutral' | 'warning' | 'error' | 'success'
  message: string
  charactersRemaining?: number
}

export interface ValidationConfig {
  minLength: number
  maxLength: number
  required?: boolean
}

/**
 * Validates text input against length constraints
 */
export function validateTextInput(
  value: string,
  config: ValidationConfig
): ValidationResult {
  const { minLength, maxLength, required = true } = config
  const length = value.length
  const trimmedLength = value.trim().length

  // Check if required field is empty
  if (required && trimmedLength === 0) {
    return {
      isValid: false,
      status: 'neutral',
      message: `Enter text (${minLength}-${maxLength} characters)`,
      charactersRemaining: maxLength
    }
  }

  // Check minimum length
  if (trimmedLength < minLength) {
    return {
      isValid: false,
      status: 'warning',
      message: `${minLength - trimmedLength} more characters needed`,
      charactersRemaining: maxLength - length
    }
  }

  // Check maximum length
  if (length > maxLength) {
    return {
      isValid: false,
      status: 'error',
      message: `${length - maxLength} characters over limit`,
      charactersRemaining: maxLength - length
    }
  }

  // Valid input
  return {
    isValid: true,
    status: 'success',
    message: `${maxLength - length} characters remaining`,
    charactersRemaining: maxLength - length
  }
}

/**
 * Validates system instructions
 */
export function validateInstructions(instructions: string): ValidationResult {
  return validateTextInput(instructions, {
    minLength: 10,
    maxLength: 4000,
    required: true
  })
}

/**
 * Validates test prompt
 */
export function validatePrompt(prompt: string): ValidationResult {
  return validateTextInput(prompt, {
    minLength: 5,
    maxLength: 2000,
    required: true
  })
}

/**
 * Gets CSS classes for input based on validation status
 */
export function getInputClasses(status: ValidationResult['status']): string {
  const baseClasses = 'w-full p-3 border rounded-lg resize-y font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
  
  switch (status) {
    case 'error':
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500/20`
    case 'warning':
      return `${baseClasses} border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/20`
    case 'success':
      return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-500/20`
    default:
      return `${baseClasses} border-input`
  }
}

/**
 * Gets CSS classes for helper text based on validation status
 */
export function getHelperTextClasses(status: ValidationResult['status']): string {
  switch (status) {
    case 'error':
      return 'text-xs text-red-600'
    case 'warning':
      return 'text-xs text-yellow-600'
    case 'success':
      return 'text-xs text-green-600'
    default:
      return 'text-xs text-muted-foreground'
  }
}