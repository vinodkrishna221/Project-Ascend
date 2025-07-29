---
inclusion: manual
---

# Authentication Infrastructure Implementation Guide

This steering file documents the comprehensive authentication infrastructure implemented for Ascend, providing guidance for future development and maintenance.

## Task 1 Implementation Summary

**Task**: Set up authentication infrastructure and database schema
**Status**: ✅ Completed
**Branch**: `auth-setup-jahnavi`
**Commit**: "Added initial authentication setup"

## 🏗️ Architecture Decisions Made

### 1. Supabase-First Approach
**Decision**: Use Supabase as the primary backend infrastructure
**Rationale**: 
- Provides PostgreSQL database, authentication, real-time subscriptions, and file storage in one platform
- Reduces infrastructure complexity and development time
- Built-in Row Level Security (RLS) for secure multi-tenant data access
- Auto-generates REST and GraphQL APIs

### 2. Dual Verification System
**Decision**: Implement both email verification and college database verification
**Rationale**:
- Email verification for colleges that provide student emails
- College database verification for institutions without student email systems
- Ensures comprehensive coverage of all college types in India

### 3. JWT Token Management with Refresh Rotation
**Decision**: Custom JWT implementation with refresh token rotation
**Rationale**:
- Enhanced security through token rotation
- Stateless authentication suitable for distributed systems
- Custom implementation allows for student-specific claims

## 📁 Files Created and Their Purpose

### Database Layer
```
web/supabase/
├── config.toml                     # Supabase local development configuration
└── migrations/
    └── 20240101000000_initial_auth_schema.sql  # Complete database schema
```

**Key Database Components**:
- **6 Core Tables**: profiles, college_domains, college_student_database, email_verifications, user_sessions, auth_audit_log
- **4 Custom Enums**: user_role, verification_status, verification_method, domain_verification_type
- **RLS Policies**: 12 security policies for data access control
- **Database Functions**: 4 utility functions for common operations
- **Indexes**: Performance-optimized indexes on frequently queried columns

### Type System
```
web/src/lib/
├── database.types.ts               # Generated Supabase database types
└── auth.types.ts                   # Authentication-specific types and interfaces
```

**Type Safety Approach**:
- Complete TypeScript coverage for all database operations
- Separate interfaces for Row, Insert, and Update operations
- Request/Response types for all API endpoints
- Validation constants for consistent behavior

### Service Layer
```
web/src/lib/
├── auth.service.ts                 # Core authentication business logic
├── auth.middleware.ts              # API authentication middleware
├── validation.ts                   # Input validation with Zod schemas
└── supabase.ts                     # Supabase client configuration
```

**Service Architecture**:
- **EmailVerificationService**: College email domain validation and code management
- **CollegeDBVerificationService**: Alternative verification for non-email colleges
- **SessionService**: JWT token generation, validation, and refresh management
- **AuthService**: Main authentication orchestration

### API Layer
```
web/src/pages/api/v1/
├── auth/
│   ├── verify-email.ts             # Initiate email verification
│   ├── verify-code.ts              # Verify email code and create account
│   ├── verify-college-credentials.ts # College database verification
│   └── refresh-token.ts            # Token refresh endpoint
└── colleges/
    └── index.ts                    # List approved colleges
```

**API Design Principles**:
- RESTful endpoint structure with versioning
- Consistent error handling and response formats
- Comprehensive input validation
- Proper HTTP status codes and error messages

## 🔐 Security Implementation Details

### Row Level Security (RLS) Policies
```sql
-- Example: Users can only view verified profiles
CREATE POLICY "Users can view verified profiles" ON profiles
  FOR SELECT USING (verification_status = 'verified');

-- Example: Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (user_id = auth.uid());
```

### Password Security
- **College Database Passwords**: bcrypt with 12 salt rounds
- **JWT Secrets**: Environment variable configuration
- **Session Management**: Refresh token hashing and rotation

### Input Validation
```typescript
// Example: Email verification request validation
export const emailVerificationRequestSchema = z.object({
  email: collegeEmailSchema
})

// Example: College credentials validation
export const collegeCredentialsRequestSchema = z.object({
  college_id: collegeIdSchema,
  student_name: studentNameSchema,
  branch: branchSchema,
  year: yearSchema,
  verification_password: verificationPasswordSchema,
  roll_number: rollNumberSchema
})
```

## 🔄 Authentication Flows Implemented

### 1. Email Verification Flow
```
1. User submits college email
2. System validates domain against approved colleges
3. Verification code generated and sent (logged for development)
4. User submits code for verification
5. Account created with verified status
6. JWT tokens generated and returned
```

### 2. College Database Verification Flow
```
1. User selects college without email domain
2. User provides student details and verification password
3. System looks up student in college database
4. Password verified using bcrypt
5. Account created with verified status
6. Student record marked as used
7. JWT tokens generated and returned
```

### 3. Token Refresh Flow
```
1. Client submits refresh token
2. System validates token and checks session
3. New access and refresh tokens generated
4. Old refresh token invalidated
5. New tokens returned to client
```

## 📊 Database Schema Design Decisions

### User Roles Hierarchy
```typescript
enum UserRole {
  STUDENT = 'student',           // Verified college student
  ASPIRANT = 'aspirant',         // College aspirant (limited access)
  GUILD_ADMIN = 'guild_admin',   // College guild administrator
  PLATFORM_ADMIN = 'platform_admin' // Platform administrator
}
```

### Verification Status Lifecycle
```typescript
enum VerificationStatus {
  PENDING = 'pending',     // Initial state
  VERIFIED = 'verified',   // Successfully verified
  REJECTED = 'rejected',   // Verification failed
  SUSPENDED = 'suspended'  // Account suspended
}
```

### College Domain Management
```sql
CREATE TABLE college_domains (
  domain TEXT UNIQUE,              -- Nullable for colleges without email
  college_name TEXT NOT NULL,
  provides_email BOOLEAN DEFAULT TRUE,  -- Key field for verification method
  verification_type domain_verification_type DEFAULT 'automatic'
);
```

## 🛠️ Development Tools and Scripts

### Setup and Verification
```
web/scripts/setup-auth.js          # Comprehensive setup verification script
web/README.md                      # Detailed documentation and setup guide
web/FIXES_APPLIED.md              # Post-implementation fixes documentation
```

### Configuration Files
```
web/tsconfig.json                 # TypeScript configuration
web/.env.example                  # Environment variables template
web/.eslintrc.json                # Code quality configuration
```

## 🧪 Testing and Quality Assurance

### Type Safety Verification
- All files pass TypeScript strict mode compilation
- No `any` types used - full type safety maintained
- Generated types from database schema ensure consistency

### Code Quality Standards
- ESLint configuration with no warnings or errors
- Consistent naming conventions across all files
- Comprehensive error handling in all service functions

### Security Validation
- Input validation on all API endpoints
- SQL injection prevention through parameterized queries
- XSS protection through proper input sanitization
- Rate limiting considerations for verification attempts

## 🔮 Future Development Guidelines

### Adding New Authentication Methods
1. Create new verification service class
2. Add corresponding database tables if needed
3. Implement API endpoints following existing patterns
4. Add validation schemas and types
5. Update middleware to handle new method

### Extending User Roles
1. Add new role to `user_role` enum in migration
2. Update TypeScript types in `auth.types.ts`
3. Add RLS policies for new role permissions
4. Update middleware role checking logic

### Database Schema Changes
1. Create new migration file with descriptive name
2. Update RLS policies as needed
3. Regenerate TypeScript types
4. Update service functions to use new schema
5. Test all affected functionality

## 📈 Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (email, user_id, created_at)
- Composite indexes for common query patterns
- Proper foreign key relationships for data integrity

### API Performance
- Input validation to prevent malicious requests
- Proper error handling to avoid information leakage
- Caching strategies for frequently accessed data (college domains)

### Security Performance
- bcrypt work factor tuned for security vs. performance balance
- JWT token expiry times optimized for user experience
- Session cleanup functions to prevent database bloat

## 🚨 Critical Security Notes

### Environment Variables
```bash
# Required for production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your-super-secret-jwt-secret-key
```

### Production Deployment Checklist
- [ ] Strong JWT secrets generated
- [ ] Environment variables secured
- [ ] RLS policies enabled and tested
- [ ] Rate limiting implemented
- [ ] HTTPS enforced
- [ ] Database backups configured
- [ ] Monitoring and alerting set up

## 🔗 Integration Points

### Frontend Integration
- Use `auth.types.ts` for TypeScript integration
- Import `supabase` client for database operations
- Use `auth.middleware.ts` for protected routes
- Follow validation schemas for form validation

### External Services Integration
- Email service integration point in `EmailVerificationService.sendVerificationCode`
- SMS service can be added following similar patterns
- OAuth providers can be integrated through Supabase Auth

This implementation provides a solid foundation for Ascend's authentication system while maintaining security, scalability, and developer experience best practices.