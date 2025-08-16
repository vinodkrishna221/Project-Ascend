# Ascend Web Application

## Authentication Infrastructure

This is the web application for Ascend, a student-only social network built with Next.js 14 and Supabase with a comprehensive authentication system designed specifically for student verification and college-based access control.

### 🏗️ Architecture Overview

The authentication system is built on Supabase with custom verification flows for:
- **Email Verification**: College email domain validation
- **College Database Verification**: Alternative verification for colleges without student emails
- **Role-Based Access Control**: Student, Aspirant, Guild Admin, Platform Admin roles
- **Session Management**: JWT tokens with refresh rotation


### 📁 Project Structure

```
web/
├── src/
│   ├── lib/
│   │   ├── auth.service.ts      # Authentication business logic
│   │   ├── auth.types.ts        # TypeScript types and interfaces
│   │   ├── auth.middleware.ts   # API authentication middleware
│   │   ├── validation.ts        # Input validation schemas
│   │   ├── supabase.ts         # Supabase client configuration
│   │   └── database.types.ts   # Generated database types
│   └── pages/
│       └── api/
│           └── v1/
│               ├── auth/        # Authentication endpoints
│               └── colleges/    # College management endpoints
├── supabase/
│   ├── config.toml             # Supabase configuration
│   └── migrations/             # Database migrations
├── scripts/
│   └── setup-auth.js          # Setup verification script
├── public/                    # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

### 🗄️ Database Schema

#### Core Tables
- **profiles**: User profiles extending Supabase auth.users
- **college_domains**: Approved college domains and verification settings
- **college_student_database**: Student records for non-email colleges
- **email_verifications**: Email verification codes and attempts tracking
- **user_sessions**: JWT refresh token management
- **auth_audit_log**: Security audit trail

#### Custom Types (Enums)
- **user_role**: `student`, `aspirant`, `guild_admin`, `platform_admin`
- **verification_status**: `pending`, `verified`, `rejected`, `suspended`
- **verification_method**: `email`, `college_database`, `manual`
- **domain_verification_type**: `automatic`, `manual`, `suspended`, `database_only`

### 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Token Management**: Access tokens (24h) + refresh tokens (30d) with rotation
- **Password Hashing**: bcrypt with 12 salt rounds for college database passwords
- **Rate Limiting**: Protection against brute force attacks
- **Audit Logging**: Comprehensive security event tracking
- **Input Validation**: Zod schemas for all API inputs

### 🚀 API Endpoints

#### Authentication
- `POST /api/v1/auth/verify-email` - Initiate email verification
- `POST /api/v1/auth/verify-code` - Verify email code and create account
- `POST /api/v1/auth/verify-college-credentials` - College database verification
- `POST /api/v1/auth/refresh-token` - Refresh access tokens

#### College Management
- `GET /api/v1/colleges` - List approved colleges with filtering

## Authentication Flow

### Email Verification Flow
1. User enters college email on signup
2. System validates email domain against approved colleges
3. Verification code sent to email
4. User enters code to complete verification
5. Account created and user redirected to dashboard

### College Database Verification Flow
1. User selects college without email domain
2. User enters student credentials (name, branch, year, password)
3. System validates against college student database
4. Credentials marked as used to prevent duplicates
5. Account created and user redirected to dashboard

## Admin Features

### College Management
- View all colleges with filtering and search
- Add new college domains
- Manage email vs database verification types
- View college statistics

### Student Database Management
- Bulk upload student data for colleges
- Manage individual student records
- View verification analytics
- Handle domain requests

### 🛠️ Setup Instructions

#### Prerequisites
- Node.js 18+ and npm
- Docker Desktop (for local Supabase)

#### Installation
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start Supabase locally** (requires Docker):
   ```bash
   npx supabase start
   ```

4. **Apply database migrations**:
   ```bash
   npx supabase db push
   ```

5. **Verify setup**:
   ```bash
   node scripts/setup-auth.js
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

### 🧪 Testing the Authentication System

#### Test Email Verification
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "student@iitd.ac.in"}'
```

#### Test College List
```bash
curl http://localhost:3000/api/v1/colleges
```

#### Test College Credentials (after adding student data)
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-college-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "college_id": "uuid-here",
    "student_name": "John Doe",
    "branch": "Computer Science",
    "year": 2024,
    "verification_password": "password123"
  }'
```

### 📝 Development Workflow

#### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest in watch mode

#### Code Quality
- TypeScript strict mode enabled
- ESLint configuration for Next.js
- Prettier for code formatting
- Zod for runtime validation

#### Database Operations
```bash
# Generate new migration
npx supabase db diff -f migration_name

# Reset local database
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### 🔧 Configuration

#### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
- `JWT_SECRET`: Secret for JWT token signing
- `NEXT_PUBLIC_APP_URL`: Application URL

#### Supabase Configuration
The `supabase/config.toml` file contains local development settings:
- Database port: 54322
- API port: 54321
- Studio port: 54323
- JWT expiry: 24 hours
- Refresh token rotation: enabled

### 🚨 Security Considerations

#### Production Deployment
1. **Environment Variables**: Use secure environment variable management
2. **JWT Secrets**: Generate strong, unique JWT secrets
3. **Database Security**: Enable RLS policies in production
4. **Rate Limiting**: Implement API rate limiting
5. **HTTPS**: Ensure all communications use HTTPS
6. **Monitoring**: Set up security monitoring and alerting

#### College Data Management
- College student databases are initially managed by Ascend administrators
- Future enhancement will allow colleges to manage their own student data
- All verification passwords are hashed with bcrypt
- Student records are marked as used after account creation

## Deployment

The application is ready for deployment on Vercel, Netlify, or any platform supporting Next.js.

1. Build the application:
```bash
npm run build
```

2. Set environment variables in your deployment platform
3. Deploy the built application

### 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Authentication Requirements](../.kiro/specs/authentication-flow-spec/requirements.md)
- [Authentication Design](../.kiro/specs/authentication-flow-spec/design.md)

### 🤝 Contributing

1. Follow the established code structure and naming conventions
2. Add comprehensive TypeScript types for all new features
3. Include proper error handling and validation
4. Write tests for new authentication flows
5. Update documentation for any API changes
6. Use TypeScript for all new code
7. Implement proper error handling and validation
8. Test authentication flows thoroughly
9. Maintain responsive design principles

### 📞 Support

For questions about the authentication system, refer to:
- Requirements document: `.kiro/specs/authentication-flow-spec/requirements.md`
- Design document: `.kiro/specs/authentication-flow-spec/design.md`
- Task list: `.kiro/specs/authentication-flow-spec/tasks.md`
