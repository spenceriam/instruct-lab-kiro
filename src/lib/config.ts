/**
 * Application configuration management
 * Centralizes environment variables and deployment settings
 */

export interface AppConfig {
  // API Configuration
  openRouterApiUrl: string;
  appUrl: string;
  
  // Security Configuration
  sessionTimeout: number;
  maxStorageSize: number;
  
  // Performance Configuration
  modelCacheTtl: number;
  maxRetries: number;
  retryDelay: number;
  
  // Feature Flags
  enableAnalytics: boolean;
  enableDebug: boolean;
  enablePerformanceMonitor: boolean;
  
  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get application configuration from environment variables
 */
export function getConfig(): AppConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // API Configuration
    openRouterApiUrl: process.env.NEXT_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || (isDevelopment ? 'http://localhost:3000' : ''),
    
    // Security Configuration (1 hour default)
    sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600000', 10),
    maxStorageSize: parseInt(process.env.NEXT_PUBLIC_MAX_STORAGE_SIZE || '10485760', 10), // 10MB
    
    // Performance Configuration
    modelCacheTtl: parseInt(process.env.NEXT_PUBLIC_MODEL_CACHE_TTL || '3600000', 10), // 1 hour
    maxRetries: parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.NEXT_PUBLIC_RETRY_DELAY || '1000', 10),
    
    // Feature Flags
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' || isDevelopment,
    enablePerformanceMonitor: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITOR === 'true' || isDevelopment,
    
    // Environment
    isDevelopment,
    isProduction,
  };
}

/**
 * Validate required environment variables
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getConfig();

  // Validate required URLs
  if (!config.openRouterApiUrl) {
    errors.push('NEXT_PUBLIC_OPENROUTER_API_URL is required');
  }

  // Validate numeric values
  if (config.sessionTimeout <= 0) {
    errors.push('NEXT_PUBLIC_SESSION_TIMEOUT must be a positive number');
  }

  if (config.maxStorageSize <= 0) {
    errors.push('NEXT_PUBLIC_MAX_STORAGE_SIZE must be a positive number');
  }

  if (config.maxRetries < 0) {
    errors.push('NEXT_PUBLIC_MAX_RETRIES must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export singleton config instance
export const config = getConfig();