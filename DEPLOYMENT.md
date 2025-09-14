# Deployment Guide

This document outlines the deployment process for Instruct-Lab on Vercel.

## Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Access to Vercel account

## Environment Variables

The following environment variables need to be configured in your Vercel project:

### Required Variables
- `NEXT_PUBLIC_OPENROUTER_API_URL` - OpenRouter API endpoint (default: https://openrouter.ai/api/v1)

### Optional Variables
- `NEXT_PUBLIC_APP_URL` - Your application URL (auto-detected in production)
- `NEXT_PUBLIC_SESSION_TIMEOUT` - Session timeout in milliseconds (default: 3600000)
- `NEXT_PUBLIC_MAX_STORAGE_SIZE` - Maximum storage size in bytes (default: 10485760)
- `NEXT_PUBLIC_MODEL_CACHE_TTL` - Model cache TTL in milliseconds (default: 3600000)
- `NEXT_PUBLIC_MAX_RETRIES` - Maximum API retry attempts (default: 3)
- `NEXT_PUBLIC_RETRY_DELAY` - Retry delay in milliseconds (default: 1000)
- `NEXT_PUBLIC_ENABLE_ANALYTICS` - Enable analytics (default: false)
- `NEXT_PUBLIC_ENABLE_DEBUG` - Enable debug mode (default: false in production)
- `NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITOR` - Enable performance monitoring (default: false in production)

## Deployment Steps

### 1. Pre-deployment Checks

Run the deployment script to validate everything is ready:

```bash
./scripts/deploy.sh
```

This script will:
- Check dependencies for security vulnerabilities
- Run type checking
- Execute linting
- Run all tests
- Build the application
- Verify required files exist

### 2. Initial Deployment

```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 3. Configure Environment Variables

In the Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the required variables for each environment (Development, Preview, Production)

### 4. Verify Deployment

After deployment, verify:

- [ ] Application loads correctly
- [ ] All security headers are present
- [ ] API endpoints respond correctly
- [ ] Performance metrics are acceptable
- [ ] Error handling works as expected

## Security Configuration

The deployment includes the following security measures:

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

### Function Configuration
- API routes have a 30-second timeout
- Automatic compression enabled
- Static asset caching optimized

## Performance Optimizations

The deployment includes:

- **Image Optimization**: WebP and AVIF formats with multiple device sizes
- **Bundle Optimization**: Code splitting and tree shaking
- **Caching Strategy**: Static assets cached for 1 week
- **Compression**: Gzip compression enabled
- **CSS Optimization**: Optimized CSS bundling

## Monitoring

### Build Analysis

To analyze bundle size:

```bash
npm run build:analyze
```

### Performance Monitoring

The application includes built-in performance monitoring that can be enabled via environment variables.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors: `npx tsc --noEmit`
   - Check ESLint errors: `npm run lint`
   - Verify all dependencies are installed: `npm ci`

2. **Environment Variable Issues**
   - Ensure all required variables are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)
   - Verify NEXT_PUBLIC_ prefix for client-side variables

3. **Performance Issues**
   - Check bundle size with analyzer
   - Verify image optimization settings
   - Monitor function execution times

### Support

For deployment issues:
1. Check Vercel function logs
2. Verify environment configuration
3. Test locally with production build: `npm run build && npm start`

## Rollback Procedure

If issues occur after deployment:

1. **Immediate Rollback**: Use Vercel dashboard to promote a previous deployment
2. **Fix and Redeploy**: Address issues and run deployment script again
3. **Hotfix**: For critical issues, create a hotfix branch and deploy directly

## Security Considerations

- API keys are never stored server-side
- All data is encrypted in browser session storage
- No tracking or analytics by default
- Direct API communication (no proxy)
- Automatic session cleanup on browser close