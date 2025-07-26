# Ascend Development Guide for Team

> **For Team Members**: This guide explains exactly how we're going to build Ascend, what we'll complete first, and how our development process works.

## 🎯 Our Development Philosophy

We're building Ascend with a **"Slow and Steady"** approach - taking time to create proper specifications before writing any code. This ensures we build the right thing, the right way, from the start.

### Why We're Taking Our Time
- **Quality Over Speed**: Better to build it right once than fix it multiple times
- **Student-First Focus**: Every feature must genuinely help students feel more confident
- **Scalable Foundation**: Proper architecture now saves months of refactoring later
- **Team Alignment**: Clear specs mean everyone knows exactly what to build

## 🏗️ Our 3-Module MVP Strategy

We're building Ascend in 3 carefully planned modules, each providing standalone value:

### Module 1: Core Identity & Profiles (Foundation) 🏛️
**What it is**: The foundation - how users sign up, prove they're students, and create their digital identity.

**Why first**: Without verified users, there's no platform. This is our bedrock.

**Standalone value**: Acts as a "verified student portfolio" that students can share.

**What we're building**:
- Student/Aspirant signup with role selection
- College email verification system
- Dynamic user profiles (bio, education, skills)
- Profile editing and management
- Basic user discovery

### Module 2: Social Feed & Posts (Engagement) 📱
**What it is**: The core social engagement - students sharing work and interacting.

**Why second**: Once we have verified users, we need to give them a reason to return daily.

**Standalone value**: A fully functional social network for verified students.

**What we're building**:
- Central content feed
- Post creation (Win, Project Update, Question)
- Kudos system and threaded comments
- Anonymous posting for sensitive questions
- Real-time interactions

### Module 3: Communities & Guilds (Organization) 👥
**What it is**: Organizing users into focused groups based on interests or college.

**Why third**: After users are engaged, we help them find their tribes.

**Standalone value**: "Discord/Reddit for colleges" with verified student communities.

**What we're building**:
- Topic-based Communities (cross-college)
- Official College Guilds (college-specific)
- Group-specific feeds and member lists
- Admin/moderator tools
- Q&A sections for college aspirants

## 📋 Specifications We Need to Create

Before writing any code, we must create detailed specification documents for each feature. Here's exactly what we need to build and in what order:

### MODULE 1: Core Identity & Profiles (Foundation)

**Specification Checklist:**

- [ ] **1. `.kiro/specs/authentication-flow-spec.md`**
  - Detailed email verification workflow (step-by-step)
  - College domain validation logic
  - Error handling for failed verifications
  - Alternative verification methods (college database)
  - Session management and token refresh

- [ ] **2. `.kiro/specs/profile-management-spec.md`**
  - Profile creation wizard flow
  - Profile editing workflows
  - Skill selection and management
  - Avatar upload and management
  - Privacy settings and visibility controls

- [ ] **3. `.kiro/specs/student-verification-spec.md`**
  - College domain whitelist management
  - Verification status states and transitions
  - Manual verification process for edge cases
  - Verification badge system

### MODULE 2: The Social Feed & Posts (Engagement)

**Specification Checklist:**

- [ ] **4. `.kiro/specs/feed-algorithm-spec.md`**
  - Feed ranking and sorting logic
  - Content filtering rules
  - Pagination and infinite scroll
  - Real-time feed updates

- [ ] **5. `.kiro/specs/post-creation-spec.md`**
  - Post type definitions (Win, Project Update, Question)
  - Media upload workflow and constraints
  - Anonymous posting implementation
  - Post validation and moderation

- [ ] **6. `.kiro/specs/interaction-system-spec.md`**
  - Kudos system implementation
  - Comment threading and replies
  - Notification triggers and delivery
  - Real-time interaction updates

### MODULE 3: Communities & Guilds (Organization)

**Specification Checklist:**

- [ ] **7. `.kiro/specs/community-management-spec.md`**
  - Community creation and setup
  - Membership management (join/leave)
  - Community discovery and search
  - Community-specific feeds

- [ ] **8. `.kiro/specs/guild-system-spec.md`**
  - Guild verification process
  - Admin role management
  - Guild-specific features (Q&A for aspirants)
  - College domain to guild mapping

- [ ] **9. `.kiro/specs/moderation-system-spec.md`**
  - Content moderation workflows
  - Reporting and flagging system
  - Admin/moderator tools
  - Automated moderation rules

### Cross-Module Specifications

**Specification Checklist:**

- [ ] **10. `.kiro/specs/notification-system-spec.md`**
  - Push notification types and triggers
  - In-app notification center
  - Email notification preferences
  - Real-time notification delivery

- [ ] **11. `.kiro/specs/search-and-discovery-spec.md`**
  - Global search functionality
  - User discovery algorithms
  - Content search and filtering
  - Search result ranking

- [ ] **12. `.kiro/specs/data-migration-spec.md`**
  - Database migration strategy
  - Data seeding for development
  - Backup and recovery procedures

### Technical Implementation Specs

**Specification Checklist:**

- [ ] **13. `.kiro/specs/api-endpoints-spec.md`**
  - Detailed API endpoint definitions
  - Request/response schemas
  - Error codes and handling
  - Rate limiting specifications

- [ ] **14. `.kiro/specs/real-time-features-spec.md`**
  - WebSocket connection management
  - Real-time event types
  - Subscription management
  - Offline/online state handling

- [ ] **15. `.kiro/specs/file-upload-spec.md`**
  - Image/video upload workflows
  - File processing pipeline
  - Storage bucket organization
  - CDN integration

## 📊 Priority Order for Specification Creation

### Phase 1 (Start Here - Module 1 Foundation)
**Complete these specs first before any coding:**

- [ ] `authentication-flow-spec.md`
- [ ] `profile-management-spec.md`
- [ ] `student-verification-spec.md`

**Timeline**: Week 1-2  
**Team Focus**: Everyone contributes to these specifications  
**Goal**: Complete foundation for user identity and verification

### Phase 2 (After Module 1 - Social Engagement)
**Complete these specs after Module 1 is built:**

- [ ] `post-creation-spec.md`
- [ ] `feed-algorithm-spec.md`
- [ ] `interaction-system-spec.md`

**Timeline**: Week 9-10 (after Module 1 completion)  
**Team Focus**: Social features and engagement mechanics  
**Goal**: Enable students to share and interact with content

### Phase 3 (After Module 2 - Community Organization)
**Complete these specs after Module 2 is built:**

- [ ] `community-management-spec.md`
- [ ] `guild-system-spec.md`
- [ ] `moderation-system-spec.md`

**Timeline**: Week 17-18 (after Module 2 completion)  
**Team Focus**: Group formation and community management  
**Goal**: Organize users into meaningful communities

### Phase 4 (Cross-cutting Concerns)
**Complete these specs for platform-wide features:**

- [ ] `notification-system-spec.md`
- [ ] `api-endpoints-spec.md`
- [ ] `real-time-features-spec.md`
- [ ] `search-and-discovery-spec.md`
- [ ] `data-migration-spec.md`
- [ ] `file-upload-spec.md`

**Timeline**: As needed throughout development  
**Team Focus**: Infrastructure and platform capabilities  
**Goal**: Support all modules with robust technical foundation

## 🎯 Specification Creation Process

For each specification document, we follow this structure:

### 1. Requirements Section
- User stories in EARS format (Event, Action, Response, Source)
- Edge cases and error scenarios
- Student impact assessment
- Success criteria and metrics

### 2. Technical Design Section
- Architecture decisions and component structure
- API endpoint specifications
- Database schema changes
- Security and performance considerations

### 3. Implementation Tasks Section
- Specific coding tasks (2-4 hour chunks)
- Dependencies between tasks
- Testing strategy
- Definition of done criteria

### 4. Review and Approval Process
- Specification review by 2+ team members
- Technical feasibility assessment
- Student-first principle validation
- Final approval before coding begins

## 🚀 What We're Building First (Module 1 Breakdown)

### Week 1-2: Project Setup & Specifications
**Team Focus**: Everyone contributes to specifications

**Deliverables**:
- Complete project setup (Supabase, Next.js, React Native)
- Create all Module 1 specification documents
- Set up development environments for all team members
- Establish code review process

**Specifications to Create**:
1. `authentication-flow-spec.md` - Detailed login/signup process
2. `profile-management-spec.md` - Profile creation and editing
3. `student-verification-spec.md` - College email verification system

### Week 3-4: Authentication System
**Backend Focus**: Database schema + API endpoints
**Frontend Focus**: Login/Signup screens

**What we're building**:
- User registration with email/password
- College domain validation
- Email verification workflow
- JWT token management
- Password reset functionality

**Key Components**:
- `WelcomeScreen.tsx` - Landing page with role selection
- `SignupScreen.tsx` - Registration form
- `LoginScreen.tsx` - Login form
- `EmailVerificationScreen.tsx` - Verification process

### Week 5-6: Profile System
**Backend Focus**: Profile CRUD operations
**Frontend Focus**: Profile screens and editing

**What we're building**:
- Profile creation wizard
- Profile editing interface
- Skill selection and management
- Avatar upload system
- Profile visibility controls

**Key Components**:
- `ProfileSetupScreen.tsx` - Initial profile creation
- `ProfileScreen.tsx` - Profile display
- `EditProfileScreen.tsx` - Profile editing
- `SkillsManagementScreen.tsx` - Skill management

### Week 7-8: Student Verification & Polish
**Backend Focus**: Verification logic and admin tools
**Frontend Focus**: Verification UI and error handling

**What we're building**:
- College domain whitelist management
- Verification status tracking
- Manual verification process
- Verification badges
- Error handling and user feedback

**Key Components**:
- `RoleSelectionScreen.tsx` - Student vs Aspirant choice
- `VerificationStatusCard.tsx` - Show verification progress
- `CollegeDomainPicker.tsx` - College selection

## 👥 Team Roles & Responsibilities

### Backend Developer(s)
**Primary Focus**:
- Supabase database schema design
- API endpoint development
- Authentication and security
- Data validation and error handling
- Performance optimization

**Key Technologies**:
- PostgreSQL with Supabase
- Row Level Security (RLS) policies
- Edge Functions for custom logic
- Real-time subscriptions

### Frontend Developer(s) - Web
**Primary Focus**:
- Next.js web application
- Responsive design for desktop/tablet
- SEO optimization for student profiles
- Recruiter-focused features (future)

**Key Technologies**:
- Next.js with TypeScript
- Tailwind CSS + Headless UI
- Zustand for state management
- React Query for server state

### Frontend Developer(s) - Mobile
**Primary Focus**:
- React Native mobile app
- Native mobile interactions
- Camera integration
- Push notifications
- Offline functionality

**Key Technologies**:
- React Native with TypeScript
- React Navigation
- Native modules integration
- AsyncStorage for offline data

### Full-Stack Developer(s)
**Primary Focus**:
- Bridge between frontend and backend
- API integration
- Real-time features
- Testing and deployment

## 🛠️ Development Environment Setup

### Required Tools
- **Node.js 18+** and npm
- **Supabase CLI** for database management
- **Git** with proper configuration
- **VS Code** with recommended extensions
- **React Native development environment**

### Project Structure We're Following
```
ascend/
├── web/                    # Next.js Web Application
│   ├── src/
│   │   ├── components/     # Feature-based components
│   │   ├── pages/          # Next.js pages/routes
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and external services
│   │   └── store/          # State management (Zustand)
├── mobile/                 # React Native Mobile App
│   ├── src/
│   │   ├── components/     # Mobile-specific components
│   │   ├── screens/        # Screen components
│   │   ├── navigation/     # React Navigation setup
│   │   └── services/       # Shared services with web
├── shared/                 # Shared code between platforms
│   ├── types/              # Common TypeScript types
│   ├── constants/          # Shared constants
│   └── utils/              # Shared utility functions
└── .kiro/                  # Kiro configuration and specs
    ├── steering/           # Development guidelines
    └── specs/              # Feature specifications
```

### Daily Development Workflow

#### 1. Start of Day
```bash
# Pull latest changes
git pull upstream main

# Start Supabase
supabase start

# Start development servers
npm run dev  # in web/ directory
npm run android  # in mobile/ directory (separate terminal)
```

#### 2. Feature Development
```bash
# Create feature branch
git checkout -b feature/user-authentication

# Work on specifications first (no coding yet!)
# Create requirements.md, design.md, tasks.md

# Get spec review from team
# Only after approval, start coding

# Regular commits with clear messages
git commit -m "feat: add email verification flow

- Implement college domain validation
- Add email verification UI
- Handle verification errors gracefully"
```

#### 3. Code Review Process
```bash
# Push feature branch
git push origin feature/user-authentication

# Create Pull Request with template
# Wait for 2 team member reviews
# Address feedback and iterate
# Merge after approval
```

## 📊 Success Metrics We're Tracking

### Module 1 Success Criteria
- **User Registration**: 90%+ successful college email verifications
- **Profile Completion**: 80%+ of users complete their profiles
- **Verification Speed**: Email verification within 5 minutes
- **Error Handling**: Clear, helpful error messages for all failure cases
- **Performance**: Profile pages load in <2 seconds

### Code Quality Standards
- **Test Coverage**: 80%+ for all critical features
- **TypeScript**: Strict mode, no `any` types
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: <3s page load on 3G networks
- **Security**: All inputs validated, RLS policies implemented

## 🚫 What We DON'T Build (Yet)

To stay focused on MVP, we're explicitly NOT building:
- Project collaboration features
- Skill endorsement system
- Digital college elections
- Advanced search and filtering
- Recruiter dashboard
- Analytics and reporting
- Mobile app store deployment

These come in later phases after MVP validation.

## 📞 Communication & Coordination

### Daily Standups (15 minutes)
- What did you complete yesterday?
- What are you working on today?
- Any blockers or questions?
- Spec reviews needed?

### Weekly Planning (1 hour)
- Review completed features
- Plan next week's specifications
- Assign tasks and responsibilities
- Address any architectural decisions

### Code Review Guidelines
- All code must be reviewed by 2 team members
- Focus on student-first principles
- Check for accessibility and performance
- Verify test coverage and documentation
- Ensure security best practices

## 🎯 Our North Star

Every decision we make must pass this test:

**"Does this help students feel more confident, connected, and supported in their academic journey?"**

If the answer isn't a clear "yes," we reconsider the approach.

---

## Getting Started Checklist

- [ ] Read all steering documents in `.kiro/steering/`
- [ ] Set up development environment
- [ ] Join team communication channels
- [ ] Review Module 1 specifications (when created)
- [ ] Understand your role and responsibilities
- [ ] Complete first assigned task

**Remember**: We're building something meaningful for students. Take pride in the quality of your work, and always keep the student experience at the center of every decision.

Let's build something amazing together! 🚀