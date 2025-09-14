/**
 * Optimized icon component with lazy loading and performance enhancements
 */

import { memo, Suspense, lazy } from 'react'
import { IconProps } from 'phosphor-react'

interface OptimizedIconProps extends Omit<IconProps, 'children'> {
  name: string
  fallback?: React.ReactNode
  priority?: boolean
}

// Icon loading cache to prevent duplicate imports
const iconCache = new Map<string, React.ComponentType<IconProps>>()

/**
 * Dynamically import phosphor icons with caching
 */
const loadIcon = (iconName: string): React.ComponentType<IconProps> => {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!
  }

  const IconComponent = lazy(async () => {
    try {
      const iconModule = await import('phosphor-react')
      const Icon = (iconModule as Record<string, React.ComponentType<IconProps>>)[iconName]
      
      if (!Icon) {
        console.warn(`Icon "${iconName}" not found in phosphor-react`)
        // Return a default icon or empty component
        return { default: () => null }
      }
      
      return { default: Icon }
    } catch (error) {
      console.error(`Failed to load icon "${iconName}":`, error)
      return { default: () => null }
    }
  })

  iconCache.set(iconName, IconComponent)
  return IconComponent
}

/**
 * Default fallback for loading icons
 */
const DefaultIconFallback = memo(({ size = 24 }: { size?: number }) => (
  <div 
    className="animate-pulse bg-muted rounded"
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
))

DefaultIconFallback.displayName = 'DefaultIconFallback'

/**
 * Optimized icon component with lazy loading
 */
const OptimizedIcon = memo<OptimizedIconProps>(({ 
  name, 
  fallback, 
  priority = false,
  size = 24,
  ...props 
}) => {
  const IconComponent = loadIcon(name)
  
  const iconFallback = fallback || <DefaultIconFallback size={size} />

  if (priority) {
    // For critical icons, render immediately without Suspense
    try {
      return <IconComponent size={size} {...props} />
    } catch {
      return <>{iconFallback}</>
    }
  }

  return (
    <Suspense fallback={iconFallback}>
      <IconComponent size={size} {...props} />
    </Suspense>
  )
})

OptimizedIcon.displayName = 'OptimizedIcon'

export default OptimizedIcon

/**
 * Pre-load commonly used icons for better performance
 */
export const preloadIcons = (iconNames: string[]) => {
  if (typeof window === 'undefined') return

  iconNames.forEach(iconName => {
    loadIcon(iconName)
  })
}

/**
 * Common icons that should be preloaded
 */
export const CRITICAL_ICONS = [
  'X',
  'Check',
  'Warning',
  'Info',
  'ChevronDown',
  'ChevronUp',
  'ChevronLeft',
  'ChevronRight',
  'Plus',
  'Minus',
  'Search',
  'Settings',
  'User',
  'Home'
]

// Preload critical icons on component mount
if (typeof window !== 'undefined') {
  preloadIcons(CRITICAL_ICONS)
}