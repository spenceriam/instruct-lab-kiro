'use client'

import React from 'react'

interface ModalState {
  [key: string]: boolean
}

class ModalManager {
  private modals: ModalState = {}
  private listeners: Map<string, Set<(isOpen: boolean) => void>> = new Map()

  // Subscribe to modal state changes
  subscribe(modalId: string, callback: (isOpen: boolean) => void) {
    if (!this.listeners.has(modalId)) {
      this.listeners.set(modalId, new Set())
    }
    this.listeners.get(modalId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(modalId)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(modalId)
        }
      }
    }
  }

  // Open a modal
  open(modalId: string) {
    this.modals[modalId] = true
    this.notifyListeners(modalId, true)
  }

  // Close a modal
  close(modalId: string) {
    this.modals[modalId] = false
    this.notifyListeners(modalId, false)
  }

  // Toggle a modal
  toggle(modalId: string) {
    const isOpen = this.isOpen(modalId)
    if (isOpen) {
      this.close(modalId)
    } else {
      this.open(modalId)
    }
  }

  // Check if modal is open
  isOpen(modalId: string): boolean {
    return this.modals[modalId] || false
  }

  // Close all modals
  closeAll() {
    Object.keys(this.modals).forEach(modalId => {
      this.close(modalId)
    })
  }

  // Get all open modals
  getOpenModals(): string[] {
    return Object.keys(this.modals).filter(modalId => this.modals[modalId])
  }

  // Notify listeners of state changes
  private notifyListeners(modalId: string, isOpen: boolean) {
    const listeners = this.listeners.get(modalId)
    if (listeners) {
      listeners.forEach(callback => callback(isOpen))
    }
  }
}

// Create singleton instance
export const modalManager = new ModalManager()

// Hook for using modal state in components
export function useModal(modalId: string) {
  const [isOpen, setIsOpen] = React.useState(modalManager.isOpen(modalId))

  React.useEffect(() => {
    const unsubscribe = modalManager.subscribe(modalId, setIsOpen)
    return unsubscribe
  }, [modalId])

  return {
    isOpen,
    open: () => modalManager.open(modalId),
    close: () => modalManager.close(modalId),
    toggle: () => modalManager.toggle(modalId)
  }
}

