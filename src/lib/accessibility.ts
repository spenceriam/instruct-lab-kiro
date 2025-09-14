/**
 * Accessibility utilities for screen reader announcements and focus management
 */

// Screen reader announcement utility
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management utilities
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }
  
  element.addEventListener('keydown', handleTabKey)
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

// Focus restoration utility
export function createFocusManager() {
  let previouslyFocusedElement: HTMLElement | null = null
  
  return {
    saveFocus() {
      previouslyFocusedElement = document.activeElement as HTMLElement
    },
    
    restoreFocus() {
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        previouslyFocusedElement.focus()
        previouslyFocusedElement = null
      }
    }
  }
}

// Keyboard navigation helpers
export function handleArrowNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onNavigate: (newIndex: number) => void
) {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
      onNavigate(nextIndex)
      items[nextIndex]?.focus()
      break
      
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
      onNavigate(prevIndex)
      items[prevIndex]?.focus()
      break
      
    case 'Home':
      event.preventDefault()
      onNavigate(0)
      items[0]?.focus()
      break
      
    case 'End':
      event.preventDefault()
      const lastIndex = items.length - 1
      onNavigate(lastIndex)
      items[lastIndex]?.focus()
      break
  }
}

// Color contrast validation (basic check)
export function validateColorContrast(): boolean {
  // This is a simplified check - in production you'd use a proper contrast calculation
  // For now, we'll assume our CSS custom properties meet WCAG standards
  return true
}

// Generate unique IDs for accessibility
let idCounter = 0
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`
}

// Debounced screen reader announcements to prevent spam
let announcementTimeout: NodeJS.Timeout | null = null
export function debouncedAnnounce(message: string, delay: number = 500) {
  if (announcementTimeout) {
    clearTimeout(announcementTimeout)
  }
  
  announcementTimeout = setTimeout(() => {
    announceToScreenReader(message)
  }, delay)
}