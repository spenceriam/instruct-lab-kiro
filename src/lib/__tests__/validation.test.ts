import { validateInstructions, validatePrompt, validateTextInput } from '../validation'

describe('validation utilities', () => {
  describe('validateTextInput', () => {
    it('returns neutral status for empty input', () => {
      const result = validateTextInput('', { minLength: 5, maxLength: 100 })
      expect(result.status).toBe('neutral')
      expect(result.isValid).toBe(false)
    })

    it('returns warning status for input below minimum length', () => {
      const result = validateTextInput('hi', { minLength: 5, maxLength: 100 })
      expect(result.status).toBe('warning')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('3 more characters needed')
    })

    it('returns error status for input above maximum length', () => {
      const longText = 'a'.repeat(101)
      const result = validateTextInput(longText, { minLength: 5, maxLength: 100 })
      expect(result.status).toBe('error')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('1 characters over limit')
    })

    it('returns success status for valid input', () => {
      const result = validateTextInput('Hello world', { minLength: 5, maxLength: 100 })
      expect(result.status).toBe('success')
      expect(result.isValid).toBe(true)
      expect(result.message).toBe('89 characters remaining')
    })
  })

  describe('validateInstructions', () => {
    it('validates instructions with correct limits', () => {
      const validInstructions = 'You are a helpful assistant that provides detailed responses.'
      const result = validateInstructions(validInstructions)
      expect(result.isValid).toBe(true)
      expect(result.status).toBe('success')
    })

    it('rejects instructions that are too short', () => {
      const result = validateInstructions('Hi')
      expect(result.isValid).toBe(false)
      expect(result.status).toBe('warning')
    })

    it('rejects instructions that are too long', () => {
      const longInstructions = 'a'.repeat(4001)
      const result = validateInstructions(longInstructions)
      expect(result.isValid).toBe(false)
      expect(result.status).toBe('error')
    })
  })

  describe('validatePrompt', () => {
    it('validates prompts with correct limits', () => {
      const validPrompt = 'Write a short story about a robot.'
      const result = validatePrompt(validPrompt)
      expect(result.isValid).toBe(true)
      expect(result.status).toBe('success')
    })

    it('rejects prompts that are too short', () => {
      const result = validatePrompt('Hi')
      expect(result.isValid).toBe(false)
      expect(result.status).toBe('warning')
    })

    it('rejects prompts that are too long', () => {
      const longPrompt = 'a'.repeat(2001)
      const result = validatePrompt(longPrompt)
      expect(result.isValid).toBe(false)
      expect(result.status).toBe('error')
    })
  })
})