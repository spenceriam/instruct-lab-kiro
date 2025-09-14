/**
 * Accessibility utility tests
 */

import { 
  generateId,
  handleArrowNavigation
} from '../accessibility'
import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('Accessibility Utilities', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId('test')
      const id2 = generateId('test')
      
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^test-\d+$/)
      expect(id2).toMatch(/^test-\d+$/)
    })

    it('should use default prefix when none provided', () => {
      const id = generateId()
      expect(id).toMatch(/^a11y-\d+$/)
    })
  })

  describe('handleArrowNavigation', () => {
    const mockItems = [
      { focus: vi.fn() },
      { focus: vi.fn() },
      { focus: vi.fn() },
    ] as HTMLElement[]
    
    const mockOnNavigate = vi.fn()

    beforeEach(() => {
      mockOnNavigate.mockClear()
      mockItems.forEach(item => (item.focus as any).mockClear())
    })

    it('should handle ArrowDown navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      handleArrowNavigation(event, mockItems, 0, mockOnNavigate)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(mockOnNavigate).toHaveBeenCalledWith(1)
      expect(mockItems[1].focus).toHaveBeenCalled()
    })

    it('should wrap to beginning when at end', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      
      handleArrowNavigation(event, mockItems, 2, mockOnNavigate)
      
      expect(mockOnNavigate).toHaveBeenCalledWith(0)
      expect(mockItems[0].focus).toHaveBeenCalled()
    })

    it('should handle Home key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' })
      
      handleArrowNavigation(event, mockItems, 1, mockOnNavigate)
      
      expect(mockOnNavigate).toHaveBeenCalledWith(0)
      expect(mockItems[0].focus).toHaveBeenCalled()
    })

    it('should handle End key', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' })
      
      handleArrowNavigation(event, mockItems, 0, mockOnNavigate)
      
      expect(mockOnNavigate).toHaveBeenCalledWith(2)
      expect(mockItems[2].focus).toHaveBeenCalled()
    })
  })
})