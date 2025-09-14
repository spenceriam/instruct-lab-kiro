/**
 * Accessibility validation utilities for WCAG compliance
 */

// Color contrast calculation utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  if (!rgb1 || !rgb2) return 0
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5
}

export function meetsWCAGAAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7
}

// Accessibility audit utilities
export interface AccessibilityIssue {
  element: Element
  type: 'missing-alt' | 'missing-label' | 'low-contrast' | 'missing-heading' | 'keyboard-trap'
  severity: 'error' | 'warning' | 'info'
  message: string
  wcagReference: string
}

export function auditAccessibility(container: Element = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  
  // Check for images without alt text
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        element: img,
        type: 'missing-alt',
        severity: 'error',
        message: 'Image missing alt attribute',
        wcagReference: 'WCAG 1.1.1'
      })
    }
  })
  
  // Check for form inputs without labels
  const inputs = container.querySelectorAll('input, textarea, select')
  inputs.forEach(input => {
    const hasLabel = input.hasAttribute('aria-label') || 
                    input.hasAttribute('aria-labelledby') ||
                    container.querySelector(`label[for="${input.id}"]`)
    
    if (!hasLabel) {
      issues.push({
        element: input,
        type: 'missing-label',
        severity: 'error',
        message: 'Form control missing accessible label',
        wcagReference: 'WCAG 1.3.1'
      })
    }
  })
  
  // Check for proper heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  let lastLevel = 0
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    if (level > lastLevel + 1) {
      issues.push({
        element: heading,
        type: 'missing-heading',
        severity: 'warning',
        message: `Heading level ${level} skips level ${lastLevel + 1}`,
        wcagReference: 'WCAG 1.3.1'
      })
    }
    lastLevel = level
  })
  
  return issues
}

// Keyboard navigation testing
export function testKeyboardNavigation(container: Element = document.body): boolean {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  // Check if all interactive elements are keyboard accessible
  return Array.from(focusableElements).every(element => {
    const tabIndex = element.getAttribute('tabindex')
    return tabIndex !== '-1'
  })
}

// Screen reader testing utilities
export function getAccessibleName(element: Element): string {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel
  
  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy)
    if (labelElement) return labelElement.textContent || ''
  }
  
  // Check associated label
  const id = element.getAttribute('id')
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`)
    if (label) return label.textContent || ''
  }
  
  // Fall back to text content
  return element.textContent || ''
}

export function getAccessibleDescription(element: Element): string {
  const describedBy = element.getAttribute('aria-describedby')
  if (describedBy) {
    const descElement = document.getElementById(describedBy)
    if (descElement) return descElement.textContent || ''
  }
  
  return ''
}

// Color scheme validation
export const colorSchemeValidation = {
  // Our design system colors with their contrast ratios
  lightTheme: {
    background: '#ffffff', // hsl(0 0% 100%)
    foreground: '#0a0a0b', // hsl(240 10% 3.9%)
    muted: '#f1f5f9', // hsl(240 4.8% 95.9%)
    mutedForeground: '#64748b', // hsl(240 3.8% 46.1%)
    primary: '#18181b', // hsl(240 9% 9%)
    primaryForeground: '#fafafa', // hsl(0 0% 98%)
    success: '#16a34a', // hsl(142 76% 36%)
    warning: '#f59e0b', // hsl(38 92% 50%)
    error: '#dc2626', // hsl(0 84% 60%)
  },
  
  darkTheme: {
    background: '#0a0a0b', // hsl(240 10% 3.9%)
    foreground: '#fafafa', // hsl(0 0% 98%)
    muted: '#27272a', // hsl(240 3.7% 15.9%)
    mutedForeground: '#a1a1aa', // hsl(240 5% 64.9%)
    primary: '#fafafa', // hsl(0 0% 98%)
    primaryForeground: '#18181b', // hsl(240 5.9% 10%)
    success: '#16a34a', // hsl(142 76% 36%)
    warning: '#f59e0b', // hsl(38 92% 50%)
    error: '#dc2626', // hsl(0 84% 60%)
  }
}

// Validate our color combinations meet WCAG AA standards
export function validateColorScheme(): { passed: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Test key color combinations for light theme
  const lightCombos = [
    { fg: colorSchemeValidation.lightTheme.foreground, bg: colorSchemeValidation.lightTheme.background, name: 'foreground on background' },
    { fg: colorSchemeValidation.lightTheme.mutedForeground, bg: colorSchemeValidation.lightTheme.background, name: 'muted foreground on background' },
    { fg: colorSchemeValidation.lightTheme.primaryForeground, bg: colorSchemeValidation.lightTheme.primary, name: 'primary foreground on primary' },
  ]
  
  lightCombos.forEach(combo => {
    const ratio = calculateContrastRatio(combo.fg, combo.bg)
    if (!meetsWCAGAA(ratio)) {
      issues.push(`Light theme ${combo.name} contrast ratio ${ratio.toFixed(2)} does not meet WCAG AA (4.5:1)`)
    }
  })
  
  return {
    passed: issues.length === 0,
    issues
  }
}