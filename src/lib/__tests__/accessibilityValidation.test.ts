import { calculateContrastRatio, meetsWCAGAA, validateColorScheme } from '../accessibilityValidation'
import { describe, it, expect } from 'vitest'

describe('Accessibility Validation', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 1) // Perfect contrast
    })
    
    it('should calculate correct contrast ratio for our primary colors', () => {
      // Light theme: foreground (#0a0a0b) on background (#ffffff)
      const ratio = calculateContrastRatio('#0a0a0b', '#ffffff')
      expect(ratio).toBeGreaterThan(4.5) // Should meet WCAG AA
    })
  })
  
  describe('meetsWCAGAA', () => {
    it('should return true for ratios >= 4.5 for normal text', () => {
      expect(meetsWCAGAA(4.5)).toBe(true)
      expect(meetsWCAGAA(4.4)).toBe(false)
    })
    
    it('should return true for ratios >= 3 for large text', () => {
      expect(meetsWCAGAA(3, true)).toBe(true)
      expect(meetsWCAGAA(2.9, true)).toBe(false)
    })
  })
  
  describe('validateColorScheme', () => {
    it('should validate our design system colors meet WCAG standards', () => {
      const result = validateColorScheme()
      
      if (!result.passed) {
        console.warn('Color scheme validation issues:', result.issues)
      }
      
      // We expect our color scheme to pass, but if it doesn't, we'll see the issues
      expect(result.issues).toHaveLength(0)
    })
  })
})