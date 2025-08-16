#!/usr/bin/env node

// Remove problematic analytics files that are not part of Task 12
const fs = require('fs');

console.log('🧹 Cleaning up problematic analytics files...');

const filesToRemove = [
  'src/pages/api/v1/analytics/college-analytics.ts',
  'src/pages/api/v1/analytics/user-satisfaction.ts',
  'src/pages/api/v1/analytics/verification-patterns.ts',
  'src/pages/api/v1/analytics/system-performance.ts',
  'src/pages/api/v1/analytics/security-analytics.ts',
  'src/pages/api/v1/analytics/partnership-insights.ts',
  'src/pages/api/v1/analytics/dashboard.ts',
  'src/lib/__tests__/analytics.service.test.ts'
];

filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`✅ Removed: ${file}`);
  }
});

// Also remove the analytics directory if it's empty
const analyticsDir = 'src/pages/api/v1/analytics';
if (fs.existsSync(analyticsDir)) {
  try {
    const files = fs.readdirSync(analyticsDir);
    if (files.length === 0) {
      fs.rmdirSync(analyticsDir);
      console.log(`✅ Removed empty directory: ${analyticsDir}`);
    }
  } catch (error) {
    console.log(`ℹ️  Analytics directory not empty or doesn't exist`);
  }
}

console.log('🎉 Cleanup completed!');