#!/usr/bin/env node

// Remove trackAuthAttempt calls from auth files
const fs = require('fs');

console.log('🧹 Removing tracking calls...');

const filePath = 'src/pages/api/v1/auth/send-verification.ts';
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove all trackAuthAttempt calls (they span multiple lines)
  content = content.replace(/\s*\/\/ Track.*\n\s*await trackAuthAttempt\([^)]*\);/gs, '');
  content = content.replace(/\s*await trackAuthAttempt\([^)]*\);/gs, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Removed tracking calls from: ${filePath}`);
}

console.log('🎉 Tracking calls removed!');