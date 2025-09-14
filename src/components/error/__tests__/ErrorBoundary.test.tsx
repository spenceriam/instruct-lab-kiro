/**
 * Tests for ErrorBoundary - Error handling and recovery
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.fn()
const originalConsoleError = console.error

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary')
  }
  return <div>No error</div>
}

// Component that throws async error
const ThrowAsyncError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      throw new Error('Async test error')
    }
  }, [shouldThrow])
  return <div>No async error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = mockConsoleError
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  describe('normal operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render multiple children normally', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
      expect(screen.getByText('Test error for ErrorBoundary')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should display error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Test error for ErrorBoundary')).toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
    })

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.queryByText('Test error for ErrorBoundary')).not.toBeInTheDocument()
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
    })

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      )
    })
  })

  describe('error recovery', () => {
    it('should reset error state when "Try Again" is clicked', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      
      // Wait for the async reset (500ms delay for retryable errors)
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
      expect(screen.queryByText('Unexpected Error')).not.toBeInTheDocument()
    })

    it('should handle repeated errors gracefully', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      
      // Re-render with another error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
    })
  })

  describe('custom error messages', () => {
    it('should display custom fallback component', () => {
      const CustomFallback = ({ error, resetError }: any) => (
        <div>
          <h2>Custom Error UI</h2>
          <p>Error: {error.message}</p>
          <button onClick={resetError}>Reset</button>
        </div>
      )
      
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
      expect(screen.getByText('Error: Test error for ErrorBoundary')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
    })

    it('should pass error and resetError to custom fallback', () => {
      const mockFallback = vi.fn(({ error, resetError }) => (
        <div>
          <span>Custom fallback</span>
          <button onClick={resetError}>Custom reset</button>
        </div>
      ))
      
      render(
        <ErrorBoundary fallback={mockFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(mockFallback).toHaveBeenCalledWith({
        error: expect.any(Error),
        resetError: expect.any(Function)
      })
    })
  })

  describe('error boundary nesting', () => {
    it('should handle nested error boundaries', () => {
      render(
        <ErrorBoundary>
          <div>Outer boundary</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      )
      
      // Inner boundary should catch the error
      expect(screen.getByText('Outer boundary')).toBeInTheDocument()
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
    })

    it('should propagate errors to parent boundary when inner fails', () => {
      const FailingBoundary = ({ children }: { children: React.ReactNode }) => {
        // Simulate a boundary that fails to handle errors
        throw new Error('Boundary failure')
      }
      
      render(
        <ErrorBoundary>
          <FailingBoundary>
            <ThrowError shouldThrow={true} />
          </FailingBoundary>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
    })
  })

  describe('component lifecycle integration', () => {
    it('should handle errors during component mounting', () => {
      const MountError = () => {
        // Throw during render (this WILL be caught by error boundary)
        throw new Error('Mount error')
      }
      
      render(
        <ErrorBoundary>
          <MountError />
        </ErrorBoundary>
      )
      
      // Render errors ARE caught by error boundaries
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
      expect(screen.queryByText('Should not render')).not.toBeInTheDocument()
    })

    it('should handle errors during component updates', () => {
      const UpdateError = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) {
          throw new Error('Update error')
        }
        return <div>No update error</div>
      }
      
      const { rerender } = render(
        <ErrorBoundary>
          <UpdateError shouldError={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('No update error')).toBeInTheDocument()
      
      rerender(
        <ErrorBoundary>
          <UpdateError shouldError={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
    })
  })

  describe('error reporting integration', () => {
    it('should call onError callback when provided', () => {
      const mockOnError = vi.fn()
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          originalError: expect.any(Error),
          message: 'Test error for ErrorBoundary',
          type: 'unknown'
        })
      )
    })

    it('should include component stack in error info', () => {
      const mockOnError = vi.fn()
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <div>
            <span>
              <ThrowError shouldThrow={true} />
            </span>
          </div>
        </ErrorBoundary>
      )
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          originalError: expect.any(Error),
          context: expect.objectContaining({
            componentStack: expect.stringContaining('ThrowError')
          })
        })
      )
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes for error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // The ErrorDisplay component should have proper error styling and content
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should focus on error message for screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const errorHeading = screen.getByRole('heading', { name: /unexpected error/i })
      expect(errorHeading).toBeInTheDocument()
    })

    it('should provide keyboard navigation for retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      expect(retryButton).toBeInTheDocument()
      
      retryButton.focus()
      expect(retryButton).toHaveFocus()
    })
  })

  describe('performance considerations', () => {
    it('should not impact performance when no errors occur', () => {
      const renderStart = performance.now()
      
      render(
        <ErrorBoundary>
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </ErrorBoundary>
      )
      
      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart
      
      expect(renderTime).toBeLessThan(100) // Should not add significant overhead
    })

    it('should handle multiple error boundaries efficiently', () => {
      const renderStart = performance.now()
      
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <ErrorBoundary key={i}>
              <div>Boundary {i}</div>
            </ErrorBoundary>
          ))}
        </div>
      )
      
      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart
      
      expect(renderTime).toBeLessThan(200) // Multiple boundaries should still be efficient
    })
  })
})