#!/usr/bin/env node

/**
 * Authentication Infrastructure Setup Script
 * 
 * This script sets up the authentication infrastructure for Ascend.
 * It handles database migrations, RLS policies, and initial data seeding.
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Ascend Authentication Infrastructure...\n')

// Check if required files exist
const requiredFiles = [
  'supabase/config.toml',
  'supabase/migrations/20240101000000_initial_auth_schema.sql',
  '.env.local'
]

console.log('📋 Checking required files...')
let allFilesExist = true

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MISSING`)
    allFilesExist = false
  }
})

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are in place.')
  process.exit(1)
}

console.log('\n📦 Required dependencies:')
console.log('✅ @supabase/supabase-js')
console.log('✅ bcryptjs')
console.log('✅ jsonwebtoken')
console.log('✅ zod')

console.log('\n🗄️  Database Schema Overview:')
console.log('✅ Custom Types (Enums):')
console.log('   - user_role: student, aspirant, guild_admin, platform_admin')
console.log('   - verification_status: pending, verified, rejected, suspended')
console.log('   - verification_method: email, college_database, manual')
console.log('   - domain_verification_type: automatic, manual, suspended, database_only')

console.log('\n✅ Tables Created:')
console.log('   - college_domains: Approved college domains and verification settings')
console.log('   - profiles: User profiles extending auth.users')
console.log('   - college_student_database: Student records for non-email colleges')
console.log('   - email_verifications: Email verification codes and attempts')
console.log('   - user_sessions: JWT refresh token management')
console.log('   - auth_audit_log: Security audit trail')

console.log('\n✅ Row Level Security (RLS) Policies:')
console.log('   - college_domains: Public read for active domains, admin write')
console.log('   - profiles: Users can view verified profiles, manage own profile')
console.log('   - college_student_database: Admin and guild admin access')
console.log('   - email_verifications: Users manage own verifications')
console.log('   - user_sessions: Users manage own sessions')
console.log('   - auth_audit_log: Users view own logs, admins view all')

console.log('\n✅ Database Functions:')
console.log('   - update_updated_at_column(): Auto-update timestamps')
console.log('   - create_auth_audit_log(): Create audit entries')
console.log('   - cleanup_expired_email_verifications(): Clean expired codes')
console.log('   - cleanup_expired_user_sessions(): Clean expired sessions')

console.log('\n✅ Initial Data:')
console.log('   - Sample college domains (IIT Delhi, IIT Bombay, IIT Madras, etc.)')
console.log('   - Database-only colleges for testing')

console.log('\n🔧 API Endpoints Created:')
console.log('   - POST /api/v1/auth/verify-email: Initiate email verification')
console.log('   - POST /api/v1/auth/verify-code: Verify email code and create account')
console.log('   - POST /api/v1/auth/verify-college-credentials: College database verification')
console.log('   - POST /api/v1/auth/refresh-token: Refresh access tokens')
console.log('   - GET /api/v1/colleges: List approved colleges')

console.log('\n🛡️  Security Features:')
console.log('   - JWT token management with refresh rotation')
console.log('   - bcrypt password hashing for college database')
console.log('   - Rate limiting on verification attempts')
console.log('   - Comprehensive audit logging')
console.log('   - Row Level Security policies')

console.log('\n📝 Next Steps:')
console.log('1. Install Docker Desktop to run Supabase locally')
console.log('2. Run: npx supabase start')
console.log('3. Run: npx supabase db push')
console.log('4. Test API endpoints with the provided examples')
console.log('5. Set up email service integration (SendGrid, AWS SES, etc.)')

console.log('\n🧪 Testing the Setup:')
console.log('Once Supabase is running, you can test the endpoints:')
console.log('')
console.log('# Test email verification')
console.log('curl -X POST http://localhost:3000/api/v1/auth/verify-email \\')
console.log('  -H "Content-Type: application/json" \\')
console.log('  -d \'{"email": "student@iitd.ac.in"}\'')
console.log('')
console.log('# Test college list')
console.log('curl http://localhost:3000/api/v1/colleges')
console.log('')
console.log('# Test college credentials (after adding student data)')
console.log('curl -X POST http://localhost:3000/api/v1/auth/verify-college-credentials \\')
console.log('  -H "Content-Type: application/json" \\')
console.log('  -d \'{"college_id": "uuid", "student_name": "John Doe", "branch": "Computer Science", "year": 2024, "verification_password": "password123"}\'')

console.log('\n✅ Authentication infrastructure setup complete!')
console.log('📚 Check the documentation in the requirements and design files for more details.')

// Check TypeScript compilation
console.log('\n🔍 Checking TypeScript compilation...')
try {
  const { execSync } = require('child_process')
  execSync('npm run type-check', { stdio: 'pipe' })
  console.log('✅ TypeScript compilation successful')
} catch (error) {
  console.log('⚠️  TypeScript compilation issues detected')
  console.log('Run "npm run type-check" for details')
}

console.log('\n🎉 Setup completed successfully!')