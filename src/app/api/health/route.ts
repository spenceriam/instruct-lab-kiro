import { NextResponse } from 'next/server';
import { validateConfig } from '@/lib/config';

/**
 * Health check endpoint for monitoring deployment status
 */
export async function GET() {
  try {
    const configValidation = validateConfig();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      config: {
        isValid: configValidation.isValid,
        errors: configValidation.errors,
      },
      uptime: process.uptime(),
    };

    // Return 500 if configuration is invalid
    if (!configValidation.isValid) {
      return NextResponse.json(
        {
          ...healthData,
          status: 'unhealthy',
          message: 'Configuration validation failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}