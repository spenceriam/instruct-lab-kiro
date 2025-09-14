'use client'

import React, { ReactNode, useEffect, useRef } from 'react'
import { X } from 'phosphor-react'
import { cn } from '@/lib/utils'
import { trapFocus, createFocusManager, announceToScreenReader, generateId } from '@/lib/accessibility'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  className?: string
  ariaLabel?: string
  ariaDescribedBy?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  className,
  ariaLabel,
  ariaDescribedBy
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const focusManager = useRef(createFocusManager())
  const titleId = useRef(generateId('modal-title'))
  const descriptionId = useRef(generateId('modal-description'))

  // Handle escape key and focus trapping
  useEffect(() => {
    let cleanupFocusTrap: (() => void) | null = null

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closable) {
        announceToScreenReader('Modal closed')
        onClose()
      }
    }

    if (isOpen) {
      // Save current focus
      focusManager.current.saveFocus()
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      document.body.setAttribute('aria-hidden', 'true')
      
      // Add event listeners
      document.addEventListener('keydown', handleEscape)
      
      // Set up focus trap
      if (modalRef.current) {
        cleanupFocusTrap = trapFocus(modalRef.current)
        
        // Focus first element after a brief delay to ensure modal is rendered
        setTimeout(() => {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements?.[0] as HTMLElement
          if (firstElement) {
            firstElement.focus()
          }
        }, 100)
        
        // Announce modal opening
        announceToScreenReader(`Modal opened: ${title || ariaLabel || 'Dialog'}`)
      }
    } else {
      // Restore body scroll and aria-hidden
      document.body.style.overflow = 'unset'
      document.body.removeAttribute('aria-hidden')
      
      // Restore focus
      focusManager.current.restoreFocus()
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      document.body.removeAttribute('aria-hidden')
      if (cleanupFocusTrap) {
        cleanupFocusTrap()
      }
    }
  }, [isOpen, closable, onClose, title, ariaLabel])

  // Handle click outside to close
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current && closable) {
      announceToScreenReader('Modal closed by clicking outside')
      onClose()
    }
  }

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg sm:max-w-2xl', 
    xl: 'max-w-xl sm:max-w-3xl',
    full: 'max-w-full'
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId.current : undefined}
      aria-label={!title ? (ariaLabel || 'Dialog') : undefined}
      aria-describedby={ariaDescribedBy || descriptionId.current}
      data-testid="modal-overlay"
    >
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" 
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-card border border-border rounded-lg shadow-custom-lg animate-slide-up w-full max-h-[90vh] overflow-hidden flex flex-col focus-visible-enhanced',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
            {title && (
              <h2 
                id={titleId.current}
                className="text-base sm:text-lg font-semibold text-foreground pr-2 truncate"
              >
                {title}
              </h2>
            )}
            {closable && (
              <button
                onClick={() => {
                  announceToScreenReader('Modal closed')
                  onClose()
                }}
                className="inline-flex items-center justify-center rounded-md w-10 h-10 sm:w-8 sm:h-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-shrink-0"
                aria-label={`Close ${title || 'modal'}`}
                type="button"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div 
          id={descriptionId.current}
          className="p-4 sm:p-6 overflow-y-auto flex-1"
          role="document"
        >
          {children}
        </div>
      </div>
    </div>
  )
}