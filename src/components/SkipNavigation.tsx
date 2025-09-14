'use client'

export default function SkipNavigation() {
  return (
    <>
      <a 
        href="#main-content" 
        className="skip-link focus-visible-enhanced"
        onFocus={() => {
          // Announce to screen readers
          const announcement = document.createElement('div')
          announcement.setAttribute('aria-live', 'polite')
          announcement.className = 'sr-only'
          announcement.textContent = 'Skip navigation link focused. Press Enter to skip to main content.'
          document.body.appendChild(announcement)
          setTimeout(() => document.body.removeChild(announcement), 1000)
        }}
      >
        Skip to main content
      </a>
      <a 
        href="#test-history" 
        className="skip-link focus-visible-enhanced"
        style={{ left: '120px' }}
      >
        Skip to test history
      </a>
    </>
  )
}