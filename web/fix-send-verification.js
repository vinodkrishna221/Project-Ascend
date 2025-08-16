#!/usr/bin/env node

// Fix send-verification.ts by removing all trackAuthAttempt calls
const fs = require('fs');

console.log('🔧 Fixing send-verification.ts...');

const filePath = 'src/pages/api/v1/auth/send-verification.ts';
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the import line
  content = content.replace(/import { trackAuthAttempt } from '.*?';?\n?/g, '');
  content = content.replace(/\/\/ Removed metrics middleware import - not needed for core functionality\n?/g, '');
  
  // Remove all trackAuthAttempt calls with their surrounding context
  // This is a more aggressive approach to remove multi-line calls
  const lines = content.split('\n');
  const filteredLines = [];
  let skipLines = false;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Start skipping when we see trackAuthAttempt
    if (line.includes('trackAuthAttempt(')) {
      skipLines = true;
      braceCount = 1;
      continue;
    }
    
    // If we're skipping, count braces to know when the call ends
    if (skipLines) {
      const openBraces = (line.match(/\(/g) || []).length;
      const closeBraces = (line.match(/\)/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      // If braces are balanced and we see a semicolon, we're done with this call
      if (braceCount <= 0 && line.includes(');')) {
        skipLines = false;
        continue;
      }
      continue;
    }
    
    // Skip comment lines about tracking
    if (line.trim().startsWith('// Track')) {
      continue;
    }
    
    filteredLines.push(line);
  }
  
  content = filteredLines.join('\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

console.log('🎉 Send verification file fixed!');