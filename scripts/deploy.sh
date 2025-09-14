#!/bin/bash

# Deployment script for Instruct-Lab
# This script handles pre-deployment checks and optimizations

set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
echo "📋 Checking environment configuration..."

# Validate package.json and dependencies
echo "📦 Validating dependencies..."
npm audit --audit-level=high

# Run type checking
echo "🔍 Running type checks..."
npx tsc --noEmit

# Run linting
echo "🧹 Running ESLint..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test:run

# Build the application
echo "🏗️  Building application..."
npm run build

# Check build size
echo "📊 Analyzing bundle size..."
if [ -d ".next" ]; then
  echo "Build completed successfully!"
  echo "Build size:"
  du -sh .next
else
  echo "❌ Build failed!"
  exit 1
fi

# Verify critical files exist
echo "✅ Verifying deployment files..."
required_files=("vercel.json" ".env.example" "next.config.js" "package.json")

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

echo "🎉 Deployment preparation complete!"
echo "📝 Next steps:"
echo "   1. Set up environment variables in Vercel dashboard"
echo "   2. Deploy using: vercel --prod"
echo "   3. Verify deployment at your domain"