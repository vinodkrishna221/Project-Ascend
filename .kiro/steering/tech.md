# Ascend Technology Stack

## Platform Requirements
- **Web Application**: Responsive design for desktop and mobile browsers - essential for recruiters accessing detailed profiles and project portfolios
- **Mobile App**: Native or hybrid mobile application (iOS/Android) - primary platform for students' daily social interactions
- **Real-time Features**: Live notifications, comments, and messaging - to power live commenting on posts, Q&A for Aspirants section, and Mentorship Matching chat feature
- **Scalability**: Handle thousands of concurrent users across colleges - must handle peak traffic during key events like university-wide Digital College Elections
- **Security**: Email verification, secure authentication, data protection - critical for maintaining student-only environment and protecting academic data

## System Architecture

### Overall System Architecture with Supabase
```
┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile App    │
│   (Next.js)     │    │ (React Native)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌──────────▼───────────┐
          │    Backend API       │
          │   (Node.js/Express)  │
          │   + Real-time Logic  │
          └──────────┬───────────┘
                     │
          ┌──────────▼───────────┐
          │      SUPABASE        │
          │  ┌─────────────────┐ │
          │  │   PostgreSQL    │ │
          │  │   (Database)    │ │
          │  └─────────────────┘ │
          │  ┌─────────────────┐ │
          │  │  Authentication │ │
          │  │   (Auth/Users)  │ │
          │  └─────────────────┘ │
          │  ┌─────────────────┐ │
          │  │   File Storage  │ │
          │  │  (Images/Media) │ │
          │  └─────────────────┘ │
          │  ┌─────────────────┐ │
          │  │   Real-time     │ │
          │  │  (Subscriptions)│ │
          │  └─────────────────┘ │
          └─────────────────────┘
```

### Web Application Architecture
```
┌─────────────────────────────────────┐
│           Web App (Next.js)         │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Pages     │ │   Components    ││
│  │ - Feed      │ │ - PostCard      ││
│  │ - Profile   │ │ - CommunityList ││
│  │ - Guilds    │ │ - UserProfile   ││
│  └─────────────┘ └─────────────────┘│
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Hooks     │ │   Services      ││
│  │ - useAuth   │ │ - supabaseClient││
│  │ - usePosts  │ │ - apiService    ││
│  │ - useRealtime│ │ - uploadService ││
│  └─────────────┘ └─────────────────┘│
└─────────────┬───────────────────────┘
              │
    ┌─────────▼─────────┐
    │  Supabase Client  │
    │  - Auth           │
    │  - Database       │
    │  - Storage        │
    │  - Real-time      │
    └───────────────────┘
```

### Mobile Application Architecture
```
┌─────────────────────────────────────┐
│      Mobile App (React Native)      │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Screens   │ │   Components    ││
│  │ - FeedScreen│ │ - PostCard      ││
│  │ - Profile   │ │ - CommunityCard ││
│  │ - Camera    │ │ - ImagePicker   ││
│  └─────────────┘ └─────────────────┘│
│  ┌─────────────┐ ┌─────────────────┐│
│  │ Navigation  │ │   Services      ││
│  │ - TabNav    │ │ - supabaseClient││
│  │ - StackNav  │ │ - pushNotifs    ││
│  │ - AuthNav   │ │ - cameraService ││
│  └─────────────┘ └─────────────────┘│
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Storage   │ │   Offline       ││
│  │ - AsyncStore│ │ - CacheManager  ││
│  │ - SecureStore│ │ - SyncService   ││
│  └─────────────┘ └─────────────────┘│
└─────────────┬───────────────────────┘
              │
    ┌─────────▼─────────┐
    │  Supabase Client  │
    │  - Auth           │
    │  - Database       │
    │  - Storage        │
    │  - Real-time      │
    └───────────────────┘
```

### Supabase Integration Benefits
- **Unified Backend**: Single platform for database, auth, storage, and real-time
- **Real-time Subscriptions**: Built-in WebSocket connections for live features
- **Row Level Security**: Database-level permissions for secure data access
- **Auto-generated APIs**: RESTful and GraphQL APIs from database schema
- **Edge Functions**: Serverless functions for custom business logic
- **Built-in Auth**: Email verification, OAuth, and role-based access control

## Recommended Tech Stack
### Frontend
- **Web**: **Next.js (Primary Recommendation)**
  - *Rationale*: Built-in server-side rendering (SSR) is crucial for making user profiles and project pages SEO-friendly, essential for recruiters to discover students via search engines. Static generation for public pages improves performance.
- **Mobile**: **React Native (Primary Recommendation)**
  - *Rationale*: Leverages existing React talent and allows sharing logic between web and mobile apps. Critical for rapid development with limited resources.
- **State Management**: **Zustand (Primary) or Redux Toolkit**
  - *Rationale*: Zustand for simpler state needs, Redux Toolkit for complex features like real-time notifications and collaborative editing
- **UI Components**: **Tailwind CSS + Headless UI**
  - *Rationale*: Provides design consistency while allowing custom student-focused UI that doesn't look corporate

### Backend
- **Backend-as-a-Service**: **Supabase (Primary Recommendation)**
  - *Rationale*: Provides PostgreSQL database, authentication, file storage, and real-time subscriptions in one platform. Reduces infrastructure complexity and development time significantly.
- **Custom API Layer**: **Node.js with Express.js (Optional)**
  - *Rationale*: For complex business logic not handled by Supabase Edge Functions. Can be added incrementally as needed.
- **Database**: **Supabase PostgreSQL**
  - *Rationale*: Managed PostgreSQL with built-in Row Level Security (RLS) for secure multi-tenant data access. Auto-generates REST and GraphQL APIs.
- **Authentication**: **Supabase Auth**
  - *Rationale*: Built-in email verification, OAuth providers (Google, GitHub), and JWT token management. Perfect for student email verification workflow.
- **File Storage**: **Supabase Storage**
  - *Rationale*: S3-compatible storage with built-in CDN, image transformations, and security policies. Seamlessly integrates with authentication.
- **Real-time**: **Supabase Real-time**
  - *Rationale*: PostgreSQL change data capture for live updates. More efficient than Socket.io for database-driven real-time features.

### Infrastructure
- **Hosting**: AWS, Google Cloud, or Vercel for web deployment
- **CDN**: CloudFlare for global content delivery
- **Monitoring**: Sentry for error tracking, Analytics for user behavior
- **CI/CD**: GitHub Actions or GitLab CI for automated deployment

## Development Tools
- **Version Control**: Git with feature branch workflow
- **Code Formatting**: Prettier for JavaScript/TypeScript, Black for Python
- **Linting**: ESLint for JavaScript, Pylint for Python
- **Testing**: Jest for unit tests, Cypress for E2E testing
- **API Documentation**: Swagger/OpenAPI for backend documentation

## Common Commands

### Supabase + Next.js Stack (Primary)
```bash
# Development setup
npm install                    # Install dependencies
npm run dev                   # Start development server
supabase start               # Start local Supabase instance
supabase db reset            # Reset local database

# Database operations
supabase db diff             # Generate migration from schema changes
supabase db push             # Push migrations to remote
supabase db pull             # Pull schema from remote
supabase gen types typescript # Generate TypeScript types

# Supabase management
supabase functions new <name> # Create new Edge Function
supabase functions deploy     # Deploy Edge Functions
supabase storage ls          # List storage buckets

# Testing and deployment
npm test                     # Run test suite
npm run build               # Build for production
npm run lint                # Check code quality
vercel deploy               # Deploy to Vercel
```

### React Native Commands
```bash
# Development setup
npm install                  # Install dependencies
npx pod-install             # Install iOS dependencies (macOS only)
npm run android             # Run on Android
npm run ios                 # Run on iOS

# Build and deployment
npm run build:android       # Build Android APK
npm run build:ios          # Build iOS app
eas build --platform all   # Build with Expo Application Services
eas submit                 # Submit to app stores
```

### Alternative Node.js Stack (If custom backend needed)
```bash
# Development setup
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm test            # Run test suite
npm run lint        # Check code quality

# Database operations (with Supabase CLI)
supabase db push    # Push schema changes
supabase db pull    # Pull remote schema

# Deployment
npm run deploy:staging    # Deploy to staging
npm run deploy:prod      # Deploy to production
```

## Security Considerations
- **Email Verification**: Mandatory for college student accounts with ongoing validation
- **Role-Based Access Control (RBAC)**: Ensure only verified Guild Admins can initiate elections, manage members, or post official announcements
- **Data Privacy**: GDPR compliance for user data handling with special considerations for student data
- **Content Moderation**: Automated and manual content review systems for maintaining safe student environment
- **Rate Limiting**: Prevent spam and abuse, especially during high-traffic events like elections
- **Secure File Uploads**: Validate and sanitize all user uploads with virus scanning and content filtering
- **API Security**: Input validation, SQL injection prevention, and secure session management
- **Student Data Protection**: Enhanced privacy controls for academic information and project data

## Performance Requirements
- **Page Load Time**: < 3 seconds on 3G networks for optimal student mobile experience
- **API Response Time**: < 500ms for most endpoints, < 200ms for real-time features
- **Media Processing Pipeline**: All user-uploaded images and videos for projects must go through automated pipeline that compresses, resizes, and generates thumbnails for fast feed loading
- **Caching Strategy**: Implement at multiple levels (browser, CDN, database) with special focus on feed performance
- **Real-time Performance**: < 100ms latency for live comments and notifications
- **Search Performance**: < 1 second for student/project search across thousands of profiles

## Code Quality Standards
- Use TypeScript for type safety in JavaScript projects
- Implement comprehensive error handling and logging
- Write meaningful commit messages following conventional commits
- Maintain test coverage above 80% for critical features
- Follow REST API design principles
- Use environment variables for all configuration
- Implement proper input validation and sanitization

## Data Modeling & Schema

### Supabase Database Schema
**profiles** (extends Supabase auth.users)
- `id` (UUID, references auth.users), `name`, `bio`, `role` (student, aspirant, admin)
- `college_id`, `graduation_year`, `verification_status`, `skills` (JSONB array)
- `avatar_url`, `created_at`, `updated_at`

**posts**
- `id` (UUID), `user_id` (UUID, FK), `type` (enum: win, project_update, question)
- `title`, `content`, `media_urls` (JSONB array), `anonymous` (boolean)
- `community_id` (UUID, FK, nullable), `guild_id` (UUID, FK, nullable)
- `created_at`, `updated_at`

**communities**
- `id` (UUID), `name`, `description`, `category`, `is_public` (boolean)
- `created_by` (UUID, FK), `moderators` (UUID array), `member_count` (computed)
- `created_at`, `updated_at`

**guilds**
- `id` (UUID), `college_name`, `college_domain`, `is_verified` (boolean)
- `admin_users` (UUID array), `verification_documents` (JSONB)
- `member_count` (computed), `created_at`, `updated_at`

**projects**
- `id` (UUID), `title`, `description`, `media_urls` (JSONB array)
- `skills_used` (JSONB array), `status` (enum), `created_by` (UUID, FK)
- `created_at`, `completed_at`

**endorsements**
- `id` (UUID), `endorser_id` (UUID, FK), `endorsed_id` (UUID, FK)
- `skill_name`, `project_id` (UUID, FK), `message`, `created_at`

### Supabase-Specific Features
**Row Level Security (RLS) Policies:**
- Users can only see verified profiles
- Guild admins can manage their guild content
- Community moderators can moderate their communities
- Anonymous posts hide user identity but maintain ownership

**Real-time Subscriptions:**
- Live post updates in feeds
- Real-time comments and reactions
- Live notification system
- Election voting updates

**Storage Buckets:**
- `avatars`: Profile pictures with public read access
- `post-media`: Post images/videos with authenticated access
- `project-files`: Project documentation with role-based access

### Key Relationships with Foreign Keys
- `profiles.college_id` → `guilds.id`
- `posts.user_id` → `profiles.id`
- `posts.community_id` → `communities.id` (nullable)
- `posts.guild_id` → `guilds.id` (nullable)
- `endorsements.project_id` → `projects.id`
- Junction tables for many-to-many relationships (community_members, project_collaborators)

## API Design Philosophy

### RESTful Principles
- **Versioning**: All endpoints versioned (e.g., `/api/v1/...`)
- **HTTP Standards**: Adhere to standard HTTP verbs (GET, POST, PUT, DELETE) and status codes
- **Resource-Based URLs**: `/api/v1/users/{id}/posts` rather than `/api/v1/getUserPosts`
- **Consistent Response Format**: Standardized JSON structure with data, meta, and error fields

### API Documentation
- **Auto-Generated Docs**: Swagger/OpenAPI for automatically maintained documentation
- **Interactive Testing**: Built-in API explorer for development and testing
- **Version Management**: Clear deprecation policies and migration guides

### Error Handling
- **Consistent Error Format**: Standardized error responses with codes and messages
- **Validation Errors**: Detailed field-level validation feedback
- **Rate Limiting**: Clear headers and responses for API limits

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with refresh token rotation
- **Role-Based Permissions**: Granular permissions for different user types
- **API Key Management**: Separate keys for different client applications