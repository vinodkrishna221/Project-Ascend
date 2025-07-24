---
inclusion: always
---

# Ascend Project Structure & Code Organization

## Complete Project Structure
Based on Ascend's Supabase + Next.js + React Native architecture:

```
ascend/
├── web/                          # Next.js Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Shared UI (Header, Footer, Button, Modal)
│   │   │   ├── auth/            # Login, Signup, EmailVerification
│   │   │   ├── feed/            # FeedPost, PostCreator, PostInteractions
│   │   │   ├── profile/         # UserProfile, SkillTags, ProfileEditor
│   │   │   ├── communities/     # CommunityCard, CommunityList, JoinButton
│   │   │   ├── guilds/          # GuildHub, ElectionVoting, GuildAdmin
│   │   │   ├── projects/        # ProjectCard, CollaborationBoard
│   │   │   ├── search/          # SearchBar, FilterPanel, ResultsList
│   │   │   └── recruitment/     # RecruiterDashboard, CandidateProfile
│   │   ├── pages/               # Next.js pages/routes
│   │   │   ├── api/            # API routes (if custom backend needed)
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── feed/           # Main feed and post details
│   │   │   ├── profile/        # User profiles and settings
│   │   │   ├── communities/    # Community pages
│   │   │   ├── guilds/         # College guild pages
│   │   │   └── recruitment/    # Recruiter portal
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAuth.ts      # Authentication state
│   │   │   ├── useFeed.ts      # Feed data management
│   │   │   ├── useRealtime.ts  # Supabase real-time subscriptions
│   │   │   ├── useProfile.ts   # User profile management
│   │   │   └── useSupabase.ts  # Supabase client wrapper
│   │   ├── services/            # API and external services
│   │   │   ├── supabase/       # Supabase client and utilities
│   │   │   ├── auth.ts         # Authentication service
│   │   │   ├── posts.ts        # Post CRUD operations
│   │   │   ├── communities.ts  # Community management
│   │   │   ├── guilds.ts       # Guild operations
│   │   │   └── upload.ts       # File upload service
│   │   ├── utils/               # Helper functions
│   │   │   ├── validation.ts   # Form validation
│   │   │   ├── formatting.ts   # Date, text formatting
│   │   │   ├── constants.ts    # App constants
│   │   │   └── types.ts        # TypeScript definitions
│   │   ├── store/               # State management (Zustand)
│   │   │   ├── authStore.ts    # Authentication state
│   │   │   ├── feedStore.ts    # Feed state
│   │   │   └── uiStore.ts      # UI state (modals, notifications)
│   │   └── styles/              # Global styles and themes
│   ├── public/                  # Static assets
│   ├── supabase/               # Supabase configuration
│   │   ├── migrations/         # Database migrations
│   │   ├── functions/          # Edge Functions
│   │   └── config.toml         # Supabase config
│   └── package.json
├── mobile/                       # React Native Mobile App
│   ├── src/
│   │   ├── components/         # Mobile-specific components
│   │   │   ├── common/        # Shared mobile UI
│   │   │   ├── feed/          # Mobile feed components
│   │   │   ├── profile/       # Mobile profile components
│   │   │   ├── camera/        # Camera and media capture
│   │   │   └── navigation/    # Navigation components
│   │   ├── screens/            # Screen components
│   │   │   ├── AuthScreens/   # Login, Signup screens
│   │   │   ├── FeedScreens/   # Feed and post screens
│   │   │   ├── ProfileScreens/# Profile and settings
│   │   │   ├── CommunityScreens/# Community screens
│   │   │   └── GuildScreens/  # Guild screens
│   │   ├── navigation/         # React Navigation setup
│   │   ├── services/           # Shared services with web
│   │   ├── hooks/              # Mobile-specific hooks
│   │   ├── utils/              # Mobile utilities
│   │   └── store/              # Shared state management
│   ├── android/                # Android-specific files
│   ├── ios/                    # iOS-specific files
│   └── package.json
├── shared/                       # Shared code between web and mobile
│   ├── types/                  # Common TypeScript types
│   │   ├── database.ts         # Supabase generated types
│   │   ├── user.ts            # User-related types
│   │   ├── post.ts            # Post-related types
│   │   ├── community.ts       # Community types
│   │   └── guild.ts           # Guild types
│   ├── constants/              # Shared constants
│   │   ├── api.ts             # API endpoints
│   │   ├── roles.ts           # User roles and permissions
│   │   └── validation.ts      # Validation rules
│   ├── utils/                  # Shared utility functions
│   │   ├── validation.ts      # Common validation
│   │   ├── formatting.ts      # Text/date formatting
│   │   └── permissions.ts     # Role-based permissions
│   └── services/               # Shared service logic
│       ├── supabase.ts        # Supabase client configuration
│       └── realtime.ts        # Real-time subscription helpers
├── docs/                        # Documentation
│   ├── api/                   # API documentation
│   ├── user-stories/          # User journey documentation
│   ├── design/                # UI/UX design specs
│   ├── deployment/            # Deployment guides
│   └── database/              # Database schema documentation
├── scripts/                     # Build and utility scripts
│   ├── setup.sh              # Development environment setup
│   ├── deploy.sh             # Deployment script
│   └── generate-types.sh     # Generate TypeScript types from Supabase
├── .kiro/                       # Kiro configuration
│   ├── steering/              # AI assistant guidance
│   └── specs/                 # Feature specifications
└── README.md
```

## Naming Conventions (STRICT)
### Files and Components
- **React Components**: PascalCase (`FeedPost.tsx`, `CommunityCard.tsx`, `GuildElectionVoting.tsx`)
- **React Native Screens**: PascalCase with "Screen" suffix (`FeedScreen.tsx`, `ProfileScreen.tsx`)
- **Hooks**: camelCase with "use" prefix (`useAuth.ts`, `useFeed.ts`, `useRealtime.ts`)
- **Services**: camelCase (`authService.ts`, `postService.ts`, `supabaseClient.ts`)
- **Types**: PascalCase (`User.ts`, `Post.ts`, `Community.ts`, `Guild.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`, `USER_ROLES.ts`)
- **Utilities**: camelCase (`formatDate.ts`, `validateEmail.ts`, `checkPermissions.ts`)
- **Stores**: camelCase with "Store" suffix (`authStore.ts`, `feedStore.ts`)

### Database and API
- **Database Tables**: snake_case (`user_profiles`, `guild_members`, `post_interactions`)
- **API Endpoints**: kebab-case (`/api/v1/user-profiles`, `/api/v1/guild-elections`)
- **Environment Variables**: UPPER_SNAKE_CASE (`SUPABASE_URL`, `NEXT_PUBLIC_APP_URL`)

### Supabase-Specific
- **RLS Policies**: descriptive names (`users_can_view_verified_profiles`, `guild_admins_can_manage_elections`)
- **Edge Functions**: kebab-case (`send-notification`, `process-election-vote`)
- **Storage Buckets**: kebab-case (`user-avatars`, `post-media`, `project-files`)

## Feature-Based Organization
Group related files by Ascend's core features, not file type:

### Feed Feature Example
```
components/feed/
├── FeedPost.tsx         # Individual post display
├── PostCreator.tsx      # Create Win/Project Update/Question
├── PostInteractions.tsx # Kudos, comments, shares
├── AnonymousToggle.tsx  # Anonymous posting option
├── PostTypeSelector.tsx # Win/Project/Question selector
├── FeedFilter.tsx       # Filter by communities/guilds
└── index.ts             # Export all feed components
```

### Community Feature Example
```
components/communities/
├── CommunityCard.tsx    # Community preview card
├── CommunityList.tsx    # List of communities
├── JoinCommunityButton.tsx # Join/leave functionality
├── CommunityModerator.tsx  # Moderation tools
├── CommunityChallenge.tsx  # Community-verified challenges
├── TopicTags.tsx        # Skill/interest tags
└── index.ts
```

### Guild Feature Example
```
components/guilds/
├── GuildHub.tsx         # Main guild interface
├── GuildElection.tsx    # Digital election system
├── GuildAdmin.tsx       # Admin management tools
├── AspirantQA.tsx       # Q&A section for aspirants
├── GuildVerification.tsx # College verification process
├── GuildEvents.tsx      # Events and workshops
└── index.ts
```

### Profile Feature Example
```
components/profile/
├── UserProfile.tsx      # Main profile display
├── SkillTags.tsx       # Skill display and management
├── ProjectPortfolio.tsx # Project showcase
├── SkillEndorsements.tsx # Endorsement system
├── ProfileBadges.tsx    # Verification and achievement badges
├── MentorshipStatus.tsx # Mentorship availability
└── index.ts
```

## Core Domain Models (Aligned with Supabase Schema)
Structure code around Ascend's core entities:

### User Management Domain
- **Profiles**: Student vs aspirant roles, college verification, skill tags
- **Authentication**: Email verification, college domain validation, role assignment
- **Verification**: College email verification, guild membership validation

### Content Domain
- **Posts**: Three types (Win, Project Update, Question) with media support
- **Interactions**: Kudos system, comments, shares, anonymous posting
- **Media**: Image/video uploads with automatic processing pipeline

### Community Domain
- **Communities**: Topic-based cross-college groups (AI/ML, Finance, etc.)
- **Moderation**: Community moderators, content review, challenge creation
- **Membership**: Join/leave functionality, member discovery

### Guild Domain
- **College Guilds**: Official college hubs with verified admin control
- **Elections**: Digital voting system with transparent results
- **Aspirant Support**: Q&A sections, college information sharing
- **Events**: Workshop and event management within guilds

### Collaboration Domain
- **Projects**: Multi-user project collaboration with skill matching
- **Skill System**: Endorsements tied to specific projects and collaborations
- **Mentorship**: Senior-junior matching with structured guidance

### Recruitment Domain
- **Candidate Discovery**: Advanced filtering for recruiters
- **Skill Verification**: Community-verified credentials and project-based proof
- **Profile Analytics**: Comprehensive view of student journey and growth

## API Route Structure (Supabase + Custom Endpoints)

### Supabase Auto-Generated REST API
```
/rest/v1/
├── /profiles          # User profiles (GET, POST, PATCH)
├── /posts             # Posts with RLS (GET, POST, PATCH, DELETE)
├── /communities       # Communities (GET, POST, PATCH)
├── /guilds            # College guilds (GET, POST, PATCH)
├── /projects          # Project collaboration (GET, POST, PATCH)
├── /endorsements      # Skill endorsements (GET, POST)
├── /community_members # Community membership (GET, POST, DELETE)
└── /guild_members     # Guild membership (GET, POST, DELETE)
```

### Custom API Routes (Next.js API Routes or Edge Functions)
```
/api/v1/
├── /auth/
│   ├── /verify-email     # College email verification
│   ├── /verify-college   # College domain validation
│   └── /role-assignment  # Assign student/aspirant roles
├── /feed/
│   ├── /personalized     # Algorithm-based feed
│   ├── /trending         # Trending posts across communities
│   └── /notifications    # Real-time notification system
├── /guilds/
│   ├── /elections        # Digital election management
│   ├── /verify-admin     # Guild admin verification
│   └── /aspirant-qa      # Q&A section management
├── /communities/
│   ├── /challenges       # Community-verified challenges
│   ├── /moderation       # Content moderation tools
│   └── /recommendations  # Community recommendations
├── /projects/
│   ├── /collaboration    # Project collaboration matching
│   ├── /skill-matching   # Find collaborators by skills
│   └── /progress-tracking # Project milestone tracking
├── /recruitment/
│   ├── /candidate-search # Advanced candidate filtering
│   ├── /skill-verification # Verify candidate skills
│   └── /analytics        # Recruiter analytics dashboard
├── /media/
│   ├── /upload           # File upload with processing
│   ├── /process          # Image/video processing pipeline
│   └── /cdn              # CDN management
└── /admin/
    ├── /content-moderation # Platform-wide moderation
    ├── /user-verification  # Manual verification processes
    └── /analytics          # Platform analytics
```

## Code Style Rules & Best Practices

### TypeScript Standards
- Use TypeScript strictly - NO `any` types, prefer `unknown` for uncertain types
- Generate types from Supabase schema: `supabase gen types typescript`
- Use discriminated unions for post types: `type Post = WinPost | ProjectPost | QuestionPost`
- Implement proper error types: `Result<T, Error>` pattern for service functions

### React/Next.js Standards
- Use functional components with hooks exclusively
- Implement proper error boundaries for each major feature
- Use React.memo() for expensive components (feed posts, user profiles)
- Implement proper loading states and skeleton screens
- Use Next.js Image component for all images with proper optimization

### Supabase Integration Standards
- Use Row Level Security (RLS) policies instead of API-level authorization
- Implement real-time subscriptions for live features (comments, notifications)
- Use Supabase Edge Functions for complex business logic
- Implement proper error handling for Supabase operations
- Use Supabase Storage policies for secure file access

### State Management (Zustand)
- Keep stores focused on single domains (auth, feed, ui)
- Use immer for complex state updates
- Implement proper TypeScript types for all stores
- Use subscriptions for cross-store communication

### Performance Standards
- Implement virtual scrolling for long feeds
- Use React Query/SWR for server state management
- Implement proper caching strategies for API calls
- Use lazy loading for non-critical components
- Optimize images and media with automatic compression

### Security Standards
- Validate all inputs on both client and server (Supabase RLS)
- Implement proper CSRF protection
- Use secure file upload with virus scanning
- Implement rate limiting for API endpoints
- Use environment variables for all sensitive configuration

## File Creation Guidelines

### Component Creation Workflow
1. **Determine Feature Domain**: Place in appropriate feature folder (feed, profile, communities, guilds)
2. **Follow Naming Conventions**: Use PascalCase for components, camelCase for hooks/services
3. **Include Proper TypeScript Types**: Import from shared/types or define locally
4. **Add to Feature Index**: Export from feature's index.ts file
5. **Write Tests**: Create parallel test structure in `__tests__` folder
6. **Document Props**: Use JSDoc comments for component props and complex functions

### Service Creation Workflow
1. **Identify Domain**: Place in appropriate service folder (auth, posts, communities, etc.)
2. **Use Supabase Client**: Import from shared supabase configuration
3. **Implement Error Handling**: Use Result<T, Error> pattern for all service functions
4. **Add TypeScript Types**: Use generated Supabase types where possible
5. **Write Unit Tests**: Test all service functions with mock data
6. **Document API**: Add JSDoc comments for all public functions

### Database Schema Changes
1. **Create Migration**: Use `supabase db diff` to generate migration
2. **Update RLS Policies**: Ensure proper Row Level Security for new tables
3. **Generate Types**: Run `supabase gen types typescript` to update TypeScript types
4. **Update Services**: Modify service functions to use new schema
5. **Test Thoroughly**: Test all affected functionality with new schema

### Adding New Features
1. **Create Feature Folder**: Add new folder under components/ with descriptive name
2. **Define Types**: Create types file in shared/types/ for new domain
3. **Implement Components**: Build UI components following existing patterns
4. **Add Services**: Create service functions for API interactions
5. **Implement State**: Add Zustand store if complex state management needed
6. **Add Routes**: Create Next.js pages and API routes as needed
7. **Write Tests**: Comprehensive testing for new feature
8. **Update Documentation**: Add to relevant documentation files

### Mobile-Specific Guidelines
1. **Screen Components**: Place in mobile/src/screens/ with "Screen" suffix
2. **Navigation**: Update navigation configuration for new screens
3. **Platform-Specific Code**: Use Platform.OS checks for iOS/Android differences
4. **Shared Logic**: Keep business logic in shared/ folder for reuse
5. **Native Modules**: Document any native module dependencies
6. **Testing**: Test on both iOS and Android simulators/devices

### Supabase-Specific Guidelines
1. **Edge Functions**: Place in supabase/functions/ with kebab-case names
2. **Migrations**: Use descriptive names for migration files
3. **RLS Policies**: Name policies descriptively (e.g., `users_can_view_own_profile`)
4. **Storage Policies**: Implement proper access controls for file storage
5. **Real-time**: Use Supabase real-time for live features, not custom WebSocket## S
upabase Integration Patterns

### Database Access Patterns
```typescript
// Service layer pattern for database operations
export const postService = {
  async createPost(post: CreatePostInput): Promise<Result<Post, Error>> {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();
    
    return error ? { success: false, error } : { success: true, data };
  }
};
```

### Real-time Subscription Patterns
```typescript
// Hook pattern for real-time data
export const useRealtimePosts = (communityId: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    const subscription = supabase
      .channel(`community-${communityId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `community_id=eq.${communityId}`
      }, handlePostChange)
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, [communityId]);
};
```

### Row Level Security (RLS) Implementation
```sql
-- Example RLS policy for posts
CREATE POLICY "Users can view posts in their communities"
ON posts FOR SELECT
USING (
  community_id IN (
    SELECT community_id FROM community_members 
    WHERE user_id = auth.uid()
  )
);
```

## Testing Strategy

### Component Testing Structure
```
components/feed/__tests__/
├── FeedPost.test.tsx        # Component behavior testing
├── PostCreator.test.tsx     # Form validation and submission
├── PostInteractions.test.tsx # User interaction testing
└── __mocks__/               # Mock data for tests
    ├── posts.ts
    └── users.ts
```

### Service Testing Structure
```
services/__tests__/
├── authService.test.ts      # Authentication flow testing
├── postService.test.ts      # CRUD operations testing
├── supabaseClient.test.ts   # Database connection testing
└── __mocks__/               # Supabase mocks
    └── supabase.ts
```

### E2E Testing Structure
```
e2e/
├── auth/                    # Authentication flows
│   ├── student-signup.spec.ts
│   ├── college-verification.spec.ts
│   └── role-assignment.spec.ts
├── feed/                    # Feed functionality
│   ├── create-post.spec.ts
│   ├── post-interactions.spec.ts
│   └── anonymous-posting.spec.ts
├── communities/             # Community features
│   ├── join-community.spec.ts
│   ├── community-moderation.spec.ts
│   └── community-challenges.spec.ts
└── guilds/                  # Guild-specific features
    ├── guild-elections.spec.ts
    ├── aspirant-qa.spec.ts
    └── guild-admin.spec.ts
```

## Environment Configuration

### Development Environment Structure
```
.env.local                   # Local development variables
.env.staging                 # Staging environment variables
.env.production             # Production environment variables

# Required environment variables:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
CLOUDINARY_CLOUD_NAME=       # For media processing
SENTRY_DSN=                  # For error tracking
```

### Supabase Configuration Structure
```
supabase/
├── config.toml              # Supabase project configuration
├── migrations/              # Database schema migrations
│   ├── 20240101000000_initial_schema.sql
│   ├── 20240102000000_add_guilds.sql
│   └── 20240103000000_add_rls_policies.sql
├── functions/               # Edge Functions
│   ├── send-notification/
│   ├── process-election-vote/
│   └── moderate-content/
└── seed.sql                # Development seed data
```

## Deployment Structure

### Web Application Deployment (Vercel)
```
vercel.json                  # Vercel configuration
├── builds/                  # Build configurations
├── functions/               # Serverless functions
└── static/                  # Static asset optimization
```

### Mobile Application Deployment
```
mobile/
├── android/
│   ├── app/build.gradle     # Android build configuration
│   └── gradle.properties    # Android properties
├── ios/
│   ├── Podfile             # iOS dependencies
│   └── Info.plist          # iOS app configuration
├── app.json                # Expo configuration
└── eas.json                # Expo Application Services config
```

## Security Implementation

### Authentication Flow Structure
```
1. Email Signup → College Email Verification → Role Assignment → Profile Creation
2. OAuth Login → College Domain Check → Role Assignment → Profile Completion
3. Guest Access → Limited Community Browsing → Signup Prompt → Full Access
```

### Permission System Structure
```typescript
// Role-based permission checking
export const permissions = {
  canCreateGuildElection: (user: User, guild: Guild) => 
    guild.admin_users.includes(user.id),
  canModerateContent: (user: User, community: Community) =>
    community.moderators.includes(user.id),
  canEndorseSkill: (endorser: User, endorsed: User, project: Project) =>
    project.collaborators.includes(endorser.id) && 
    project.collaborators.includes(endorsed.id)
};
```

### Content Moderation Structure
```
moderation/
├── automated/               # AI-powered content filtering
│   ├── textAnalysis.ts     # Inappropriate content detection
│   ├── imageModeration.ts  # Image content analysis
│   └── spamDetection.ts    # Spam and abuse detection
├── manual/                  # Human moderation tools
│   ├── reportSystem.ts     # User reporting functionality
│   ├── moderatorDashboard.ts # Moderation interface
│   └── appealProcess.ts    # Content appeal system
└── policies/                # Moderation policies and rules
    ├── communityGuidelines.ts
    ├── guildRules.ts
    └── platformPolicies.ts
```

This comprehensive structure ensures Ascend is built with scalability, security, and maintainability in mind while leveraging Supabase's powerful features for rapid development.