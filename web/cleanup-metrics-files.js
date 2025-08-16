#!/usr/bin/env node

// Remove problematic metrics files that are not part of Task 12
const fs = require('fs');

console.log('🧹 Cleaning up problematic metrics files...');

const filesToRemove = [
  'src/pages/api/v1/metrics/system-health.ts',
  'src/pages/api/v1/metrics/onboarding-funnel.ts',
  'src/pages/api/v1/metrics/auth-success-rates.ts',
  'src/pages/api/v1/metrics/api-performance.ts',
  'src/pages/api/v1/metrics/alerts.ts',
  'src/lib/__tests__/metrics.service.test.ts',
  'src/lib/metrics.middleware.ts'
];

filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`✅ Removed: ${file}`);
  }
});

// Also remove the metrics directory if it's empty
const metricsDir = 'src/pages/api/v1/metrics';
if (fs.existsSync(metricsDir)) {
  try {
    const files = fs.readdirSync(metricsDir);
    if (files.length === 0) {
      fs.rmdirSync(metricsDir);
      console.log(`✅ Removed empty directory: ${metricsDir}`);
    }
  } catch (error) {
    console.log(`ℹ️  Metrics directory not empty or doesn't exist`);
  }
}

console.log('🎉 Cleanup completed!');