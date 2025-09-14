/**
 * Loading states and skeleton screens for better perceived performance
 */

import React, { memo } from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
  animate?: boolean
}

/**
 * Basic skeleton component
 */
export const Skeleton = memo<SkeletonProps>(({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  rounded = false,
  animate = true
}) => (
  <div
    className={`bg-muted ${animate ? 'animate-pulse' : ''} ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    style={{ width, height }}
    aria-hidden="true"
  />
))

Skeleton.displayName = 'Skeleton'

/**
 * Loading spinner component
 */
export const LoadingSpinner = memo<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}>(({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'

/**
 * Model search skeleton
 */
export const ModelSearchSkeleton = memo(() => (
  <div className="space-y-3" aria-label="Loading models">
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <Skeleton width={40} height={40} rounded />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height="1rem" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <Skeleton width={40} height={40} rounded />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height="1rem" />
        <Skeleton width="50%" height="0.75rem" />
      </div>
    </div>
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <Skeleton width={40} height={40} rounded />
      <div className="flex-1 space-y-2">
        <Skeleton width="55%" height="1rem" />
        <Skeleton width="35%" height="0.75rem" />
      </div>
    </div>
  </div>
))

ModelSearchSkeleton.displayName = 'ModelSearchSkeleton'

/**
 * Test history skeleton
 */
export const TestHistorySkeleton = memo(() => (
  <div className="space-y-4" aria-label="Loading test history">
    <div className="text-center py-8">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-muted-foreground">Loading history...</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 border border-border rounded-lg space-y-3">
          <div className="flex justify-between items-start">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="20%" height="0.75rem" />
          </div>
          <div className="space-y-2">
            <Skeleton width="100%" height="0.75rem" />
            <Skeleton width="80%" height="0.75rem" />
          </div>
          <div className="flex justify-between">
            <Skeleton width="30%" height="0.75rem" />
            <Skeleton width="25%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  </div>
))

TestHistorySkeleton.displayName = 'TestHistorySkeleton'

/**
 * Results metrics skeleton
 */
export const ResultsMetricsSkeleton = memo(() => (
  <div className="space-y-6" aria-label="Loading results">
    {/* Overall score skeleton */}
    <div className="text-center space-y-4">
      <Skeleton width={120} height={120} rounded className="mx-auto" />
      <Skeleton width="40%" height="1.5rem" className="mx-auto" />
    </div>

    {/* Individual metrics skeleton */}
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="20%" height="1rem" />
          </div>
          <Skeleton width="100%" height="0.5rem" />
        </div>
      ))}
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="60%" height="0.75rem" className="mx-auto" />
        </div>
      ))}
    </div>
  </div>
))

ResultsMetricsSkeleton.displayName = 'ResultsMetricsSkeleton'

/**
 * Modal content skeleton
 */
export const ModalSkeleton = memo<{ 
  title?: boolean
  content?: boolean
  actions?: boolean
}>(({ title = true, content = true, actions = true }) => (
  <div className="space-y-6">
    {title && (
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <Skeleton width="40%" height="1.5rem" />
        <Skeleton width={24} height={24} />
      </div>
    )}
    
    {content && (
      <div className="space-y-4">
        <Skeleton width="100%" height="1rem" />
        <Skeleton width="90%" height="1rem" />
        <Skeleton width="95%" height="1rem" />
        <div className="space-y-2 pt-4">
          <Skeleton width="100%" height="8rem" />
        </div>
      </div>
    )}
    
    {actions && (
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Skeleton width={80} height={40} />
        <Skeleton width={100} height={40} />
      </div>
    )}
  </div>
))

ModalSkeleton.displayName = 'ModalSkeleton'

/**
 * Page loading overlay
 */
export const PageLoadingOverlay = memo<{
  message?: string
  transparent?: boolean
}>(({ message = 'Loading...', transparent = false }) => (
  <div 
    className={`fixed inset-0 z-50 flex items-center justify-center ${
      transparent ? 'bg-background/80' : 'bg-background'
    } backdrop-blur-sm`}
    role="status"
    aria-live="polite"
  >
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
))

PageLoadingOverlay.displayName = 'PageLoadingOverlay'

/**
 * Inline loading state
 */
export const InlineLoading = memo<{
  message?: string
  size?: 'sm' | 'md' | 'lg'
}>(({ message, size = 'md' }) => (
  <div className="flex items-center gap-3 py-4">
    <LoadingSpinner size={size} />
    {message && (
      <span className="text-muted-foreground text-sm">{message}</span>
    )}
  </div>
))

InlineLoading.displayName = 'InlineLoading'

/**
 * Button loading state
 */
export const ButtonLoading = memo<{
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
  disabled?: boolean
  className?: string
  onClick?: () => void
}>(({ 
  children, 
  loading = false, 
  loadingText, 
  disabled = false,
  className = '',
  onClick
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center gap-2 ${className} ${
      (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {loading && <LoadingSpinner size="sm" />}
    {loading && loadingText ? loadingText : children}
  </button>
))

ButtonLoading.displayName = 'ButtonLoading'