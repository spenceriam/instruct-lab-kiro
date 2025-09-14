#!/usr/bin/env node

/**
 * Deployment verification script
 * Checks that all deployment configuration is properly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment configuration...\n');

const checks = [
  {
    name: 'Vercel configuration exists',
    check: () => fs.existsSync('vercel.json'),
    fix: 'Create vercel.json file'
  },
  {
    name: 'Environment template exists',
    check: () => fs.existsSync('.env.example'),
    fix: 'Create .env.example file'
  },
  {
    name: 'Deployment documentation exists',
    check: () => fs.existsSync('DEPLOYMENT.md'),
    fix: 'Create DEPLOYMENT.md file'
  },
  {
    name: 'Health check endpoint exists',
    check: () => fs.existsSync('src/app/api/health/route.ts'),
    fix: 'Create health check API endpoint'
  },
  {
    name: 'Configuration module exists',
    check: () => fs.existsSync('src/lib/config.ts'),
    fix: 'Create configuration module'
  },
  {
    name: 'Deployment script exists',
    check: () => fs.existsSync('scripts/deploy.sh'),
    fix: 'Create deployment script'
  },
  {
    name: 'Next.js config has security headers',
    check: () => {
      const config = fs.readFileSync('next.config.js', 'utf8');
      return config.includes('X-Content-Type-Options') && config.includes('X-Frame-Options');
    },
    fix: 'Add security headers to next.config.js'
  },
  {
    name: 'Package.json has deployment scripts',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts['deploy:check'] && pkg.scripts['deploy:prod'];
    },
    fix: 'Add deployment scripts to package.json'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All deployment configuration checks passed!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run deploy:check');
  console.log('2. Set up environment variables in Vercel');
  console.log('3. Deploy with: npm run deploy:prod');
} else {
  console.log('❌ Some deployment configuration checks failed.');
  console.log('Please fix the issues above before deploying.');
  process.exit(1);
}