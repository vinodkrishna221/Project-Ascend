# Ascend Frontend Pages & UI Guidelines

## Platform Overview
Ascend is built with a mobile-first approach using React Native for mobile apps and Next.js for web, ensuring consistent user experience across platforms while optimizing for each platform's strengths.

## Page Structure & Navigation

### Mobile App (React Native) - Primary Platform
The mobile app is the primary platform where students spend most of their time for social interactions, quick updates, and daily engagement.

#### Main Navigation (Bottom Tab Bar)
```
┌─────────────────────────────────────────────────────────────────┐
│   ⌂         👥︎         [+]        💡         👤   │
│ Feed       Groups               Projects     Profile │
└─────────────────────────────────────────────────────────────────┘
```

**Navigation Strategy:**
- **Feed**: Main content stream with posts from all sources
- **Groups**: Consolidated tab containing both Communities and Guilds as sub-tabs
- **Create (+)**: Quick post creation modal
- **Projects**: Project collaboration and portfolio showcase
- **Profile**: User profile and settings

**Groups Tab Structure:**
When users tap "Groups", they see:
```
┌─────────────────────────────────────────────────────┐
│  Groups                                    [Search] │
├─────────────────────────────────────────────────────┤
│  [Communities]  [Guilds]                           │
├─────────────────────────────────────────────────────┤
│  Content based on selected sub-tab                 │
└─────────────────────────────────────────────────────┘
```

**Benefits of Consolidated Navigation:**
- **Simplicity**: Reduces cognitive load with 4 main concepts instead of 5
- **Scalability**: Frees up space for future features like Projects or Search
- **Logical Grouping**: Communities and Guilds are both group-based social structures

#### Core Mobile Screens

**1. Authentication Flow**
- `WelcomeScreen.tsx` - Landing page with role selection (Student/Aspirant)
- `SignupScreen.tsx` - Registration with college email verification
- `LoginScreen.tsx` - Login with email/password or OAuth
- `EmailVerificationScreen.tsx` - College email verification process
- `RoleSelectionScreen.tsx` - Choose Student or Aspirant role
- `ProfileSetupScreen.tsx` - Initial profile creation

**2. Feed Screens (Tab 1)**
- `FeedScreen.tsx` - Main feed with posts from communities and guilds
- `CreatePostScreen.tsx` - Create Win/Project Update/Question posts
- `PostDetailScreen.tsx` - Individual post with comments and interactions
- `PostTypeSelectionScreen.tsx` - Choose post type (Win/Project/Question)

**3. Groups Screens (Tab 2)**
- `GroupsScreen.tsx` - Main groups hub with Communities/Guilds sub-tabs
- `CommunitiesScreen.tsx` - Browse and search communities (sub-tab)
- `CommunityDetailScreen.tsx` - Individual community with posts and members
- `CommunityMembersScreen.tsx` - View community members and moderators
- `JoinCommunityScreen.tsx` - Community preview before joining
- `CreateCommunityScreen.tsx` - Create new community (for verified users)
- `GuildsScreen.tsx` - Browse college guilds (sub-tab)
- `GuildDetailScreen.tsx` - Individual guild hub with college-specific content
- `GuildMembersScreen.tsx` - Guild members and admin panel
- `AspirantQAScreen.tsx` - Q&A section for college aspirants
- `GuildElectionScreen.tsx` - Digital election interface
- `GuildEventsScreen.tsx` - College events and workshops
- `GuildVerificationScreen.tsx` - Guild admin verification process

**4. Create Post (Tab 3 - Center Button)**
- `CreatePostModalScreen.tsx` - Quick post creation modal
- `CameraScreen.tsx` - Camera integration for media capture
- `MediaPreviewScreen.tsx` - Preview and edit captured media
- `AnonymousPostScreen.tsx` - Anonymous posting options

**5. Profile Screens (Tab 4)**
- `ProfileScreen.tsx` - User's own profile with edit options
- `UserProfileScreen.tsx` - View other users' profiles
- `EditProfileScreen.tsx` - Edit profile information and skills
- `SkillsManagementScreen.tsx` - Manage skills and endorsements
- `ProjectPortfolioScreen.tsx` - Showcase projects and achievements
- `SettingsScreen.tsx` - App settings and preferences
- `NotificationsScreen.tsx` - Notification center
- `PrivacySettingsScreen.tsx` - Privacy and security settings

**7. Additional Screens**
- `SearchScreen.tsx` - Global search for users, posts, communities
- `NotificationDetailScreen.tsx` - Individual notification details
- `ReportContentScreen.tsx` - Report inappropriate content
- `BlockUserScreen.tsx` - Block/unblock users
- `HelpSupportScreen.tsx` - Help and support center
- `OnboardingScreen.tsx` - App tutorial for new users

### Web Application (Next.js) - Secondary Platform
The web application focuses on detailed content consumption, recruitment features, and administrative tasks.

#### Web Navigation Structure
```
Header: [Logo] [Search] [Notifications] [Profile Menu]
Sidebar: [Feed] [Communities] [Guilds] [Projects] [Recruitment]
```

#### Core Web Pages

**1. Authentication Pages**
- `/auth/welcome` - Landing page with platform overview
- `/auth/signup` - Registration with enhanced form validation
- `/auth/login` - Login with remember me option
- `/auth/verify-email` - Email verification with resend option
- `/auth/forgot-password` - Password reset flow
- `/auth/reset-password` - Password reset confirmation

**2. Feed Pages**
- `/feed` - Main feed with advanced filtering options
- `/feed/trending` - Trending posts across platform
- `/feed/following` - Posts from followed users and communities
- `/post/[id]` - Individual post detail page
- `/post/create` - Enhanced post creation with rich text editor
- `/post/edit/[id]` - Edit existing posts

**3. Communities Pages**
- `/communities` - Browse all communities with categories
- `/communities/[slug]` - Individual community page
- `/communities/[slug]/members` - Community members directory
- `/communities/[slug]/moderators` - Moderation panel
- `/communities/create` - Create new community
- `/communities/[slug]/settings` - Community settings (moderators only)

**4. Guilds Pages**
- `/guilds` - Browse college guilds
- `/guilds/[slug]` - Individual guild hub
- `/guilds/[slug]/elections` - Digital election system
- `/guilds/[slug]/aspirants` - Q&A section for aspirants
- `/guilds/[slug]/events` - Guild events and workshops
- `/guilds/[slug]/admin` - Guild administration panel
- `/guilds/verify` - Guild verification process

**5. Profile Pages**
- `/profile/[username]` - Public user profile
- `/profile/edit` - Edit profile information
- `/profile/projects` - Project portfolio management
- `/profile/skills` - Skills and endorsements management
- `/profile/settings` - Account settings
- `/profile/privacy` - Privacy settings
- `/profile/notifications` - Notification preferences

**6. Project Pages**
- `/projects` - Browse all projects
- `/projects/[id]` - Individual project showcase
- `/projects/create` - Create new project
- `/projects/collaborate` - Find collaboration opportunities
- `/projects/[id]/edit` - Edit project details

**7. Search & Discovery Pages**
- `/search` - Global search with advanced filters
- `/search/users` - User directory with skill filters
- `/search/projects` - Project discovery
- `/search/communities` - Community discovery
- `/discover` - Personalized content discovery

**8. Recruitment Pages (Future)**
- `/recruitment` - Recruiter dashboard
- `/recruitment/candidates` - Candidate search and filtering
- `/recruitment/jobs` - Job posting management
- `/recruitment/analytics` - Recruitment analytics
- `/recruitment/settings` - Recruiter account settings

**9. Administrative Pages**
- `/admin` - Platform administration dashboard
- `/admin/users` - User management
- `/admin/content` - Content moderation
- `/admin/reports` - User reports and violations
- `/admin/analytics` - Platform analytics

## UI Component Library

### Core Components

#### Component States Documentation
For all interactive components, the following states must be explicitly defined and implemented:

**Button Component States:**
- `default` - Normal resting state
- `hover` - Mouse hover (web only)
- `focus` - Keyboard focus with visible ring
- `active/pressed` - Touch/click active state
- `loading` - API call in progress with spinner
- `disabled` - Non-interactive state with reduced opacity

**Form Input States:**
- `default` - Normal input state
- `focus` - Active input with border highlight
- `filled` - Input with valid content
- `error` - Validation error with red border and message
- `disabled` - Non-editable state
- `loading` - Processing state (for async validation)

**Post Card States:**
- `default` - Normal post display
- `loading` - Content loading skeleton
- `error` - Failed to load with retry option
- `selected` - Highlighted state (for multi-select)
- `archived` - Dimmed state for old content

**1. Navigation Components**
- `BottomTabBar.tsx` - Mobile bottom navigation
- `HeaderBar.tsx` - Mobile header with back button and actions
- `Sidebar.tsx` - Web sidebar navigation
- `TopNavBar.tsx` - Web top navigation
- `BreadcrumbNav.tsx` - Web breadcrumb navigation

**2. Post Components**
- `PostCard.tsx` - Individual post display
- `PostCreator.tsx` - Post creation interface
- `PostInteractions.tsx` - Kudos, comments, share buttons
- `PostTypeSelector.tsx` - Win/Project/Question selector
- `AnonymousToggle.tsx` - Anonymous posting toggle
- `MediaUploader.tsx` - Image/video upload component
- `PostFilter.tsx` - Filter posts by type/community

**3. User Components**
- `UserProfile.tsx` - User profile display
- `UserCard.tsx` - Compact user information card
- `SkillTags.tsx` - Skill display and management
- `ProfileBadges.tsx` - Verification and achievement badges
- `UserAvatar.tsx` - User profile picture with status
- `FollowButton.tsx` - Follow/unfollow functionality
- `EndorsementCard.tsx` - Skill endorsement display

**4. Community Components**
- `CommunityCard.tsx` - Community preview card
- `CommunityList.tsx` - List of communities
- `JoinCommunityButton.tsx` - Join/leave community
- `CommunityModerator.tsx` - Moderation tools
- `TopicTags.tsx` - Community topic tags
- `MembersList.tsx` - Community members display

**5. Guild Components**
- `GuildCard.tsx` - Guild preview card
- `GuildHub.tsx` - Main guild interface
- `GuildElection.tsx` - Election voting interface
- `GuildAdmin.tsx` - Admin management tools
- `AspirantQA.tsx` - Q&A section for aspirants
- `GuildVerification.tsx` - Verification status display
- `GuildEvents.tsx` - Events and workshops

**6. Project Components**
- `ProjectCard.tsx` - Project showcase card
- `ProjectPortfolio.tsx` - Project portfolio display
- `CollaborationBoard.tsx` - Find collaborators
- `ProjectTimeline.tsx` - Project progress timeline
- `SkillMatcher.tsx` - Match skills for collaboration
- `ProjectGallery.tsx` - Project media gallery

**7. Form Components**
- `FormInput.tsx` - Styled text input
- `FormTextArea.tsx` - Multi-line text input
- `FormSelect.tsx` - Dropdown selection
- `FormCheckbox.tsx` - Checkbox input
- `FormRadio.tsx` - Radio button input
- `ImagePicker.tsx` - Image selection component
- `SkillSelector.tsx` - Multi-select skill picker
- `CollegePicker.tsx` - College selection with verification

**8. UI Elements**
- `Button.tsx` - Primary, secondary, and tertiary buttons
- `Modal.tsx` - Modal dialog component
- `LoadingSpinner.tsx` - Loading indicator
- `EmptyState.tsx` - Empty state illustrations
- `ErrorBoundary.tsx` - Error handling component
- `Toast.tsx` - Toast notifications
- `Badge.tsx` - Status and notification badges
- `Card.tsx` - Content container card

**9. Search Components**
- `SearchBar.tsx` - Global search input
- `SearchFilters.tsx` - Advanced search filters
- `SearchResults.tsx` - Search results display
- `RecentSearches.tsx` - Recent search history
- `SearchSuggestions.tsx` - Search autocomplete

**10. Notification Components**
- `NotificationCard.tsx` - Individual notification
- `NotificationList.tsx` - Notification feed
- `NotificationBadge.tsx` - Unread notification indicator
- `PushNotification.tsx` - Push notification handler

### Composite Components & Patterns

These are higher-level components that combine multiple core components to create reusable patterns:

**Feed Patterns**
- `PostCardWithComments.tsx` - Combines PostCard, CommentList, CommentInput
- `FeedWithFilters.tsx` - Feed display with integrated filtering options
- `InfiniteScrollFeed.tsx` - Feed with pagination and loading states

**Authentication Patterns**
- `OnboardingFlow.tsx` - Multi-step onboarding sequence
- `AuthFormContainer.tsx` - Standardized auth form layout
- `EmailVerificationFlow.tsx` - Complete email verification process

**Community Patterns**
- `CommunityCardWithActions.tsx` - Community card with join/leave functionality
- `MemberListWithSearch.tsx` - Searchable member directory
- `ModerationPanel.tsx` - Complete moderation interface

**Guild Patterns**
- `GuildDashboard.tsx` - Complete guild management interface
- `ElectionVotingInterface.tsx` - Full election voting experience
- `AspirantQASection.tsx` - Q&A interface with threading

**Profile Patterns**
- `ProfileWithPortfolio.tsx` - Profile display with integrated project showcase
- `SkillEndorsementFlow.tsx` - Complete skill endorsement process
- `ProfileEditWizard.tsx` - Multi-step profile editing experience

## Design System & UI Guidelines

### Color Palette
```css
/* Primary Colors */
--primary-blue: #2563EB;      /* Main brand color */
--primary-blue-light: #3B82F6; /* Hover states */
--primary-blue-dark: #1D4ED8;  /* Active states */

/* Secondary Colors */
--secondary-purple: #7C3AED;   /* Accent color */
--secondary-green: #059669;    /* Success states */
--secondary-orange: #EA580C;   /* Warning states */
--secondary-red: #DC2626;      /* Error states */

/* Neutral Colors */
--gray-50: #F9FAFB;           /* Background light */
--gray-100: #F3F4F6;          /* Background */
--gray-200: #E5E7EB;          /* Border light */
--gray-300: #D1D5DB;          /* Border */
--gray-400: #9CA3AF;          /* Text muted */
--gray-500: #6B7280;          /* Text secondary */
--gray-600: #4B5563;          /* Text primary */
--gray-700: #374151;          /* Text dark */
--gray-800: #1F2937;          /* Background dark */
--gray-900: #111827;          /* Background darkest */

/* Student-Specific Colors */
--student-win: #10B981;        /* Win posts */
--student-project: #3B82F6;    /* Project posts */
--student-question: #F59E0B;   /* Question posts */
--guild-primary: #7C2D12;      /* Guild branding */
--community-primary: #0891B2;  /* Community branding */
```

### Typography Scale
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px - Captions, badges */
--text-sm: 0.875rem;   /* 14px - Body small, metadata */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Large body text */
--text-xl: 1.25rem;    /* 20px - Small headings */
--text-2xl: 1.5rem;    /* 24px - Medium headings */
--text-3xl: 1.875rem;  /* 30px - Large headings */
--text-4xl: 2.25rem;   /* 36px - Extra large headings */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
/* Spacing Scale (rem units) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Component Sizing
```css
/* Button Sizes */
--btn-sm: 2rem;       /* 32px height */
--btn-md: 2.5rem;     /* 40px height */
--btn-lg: 3rem;       /* 48px height */

/* Avatar Sizes */
--avatar-xs: 1.5rem;  /* 24px */
--avatar-sm: 2rem;    /* 32px */
--avatar-md: 2.5rem;  /* 40px */
--avatar-lg: 3rem;    /* 48px */
--avatar-xl: 4rem;    /* 64px */

/* Card Sizes */
--card-padding: 1rem;
--card-radius: 0.5rem;
--card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

### Mobile-Specific Guidelines

**Touch Targets**
- Minimum touch target: 44px × 44px
- Recommended spacing between touch targets: 8px
- Primary buttons: 48px height minimum
- Tab bar height: 60px

**Safe Areas**
- Top safe area: Account for notch/status bar
- Bottom safe area: Account for home indicator
- Side margins: 16px minimum on mobile

**Responsive Breakpoints**
```css
/* Mobile First Approach */
--mobile-sm: 320px;   /* Small phones */
--mobile-md: 375px;   /* Standard phones */
--mobile-lg: 414px;   /* Large phones */
--tablet: 768px;      /* Tablets */
--desktop: 1024px;    /* Desktop */
--desktop-lg: 1440px; /* Large desktop */
```

### Accessibility Guidelines

**Color Contrast**
- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio

**Focus States**
- All interactive elements must have visible focus indicators
- Focus ring: 2px solid primary color with 2px offset
- Skip links for keyboard navigation

**Screen Reader Support**
- All images must have alt text
- Form inputs must have labels
- Buttons must have descriptive text
- Use semantic HTML elements

**Motion & Animation**
- Respect `prefers-reduced-motion` setting
- Animations should be subtle and purposeful
- Maximum animation duration: 300ms for micro-interactions

**Concrete Animation Examples:**
- **Kudos Button**: When user gives kudos, button scales to 1.1x with light haptic feedback on mobile
- **Modal Transitions**: Modals slide up from bottom on mobile, fade in with slight scale-up (0.95x to 1x) on web
- **Post Loading**: Skeleton screens with subtle shimmer effect while content loads
- **Tab Switching**: Smooth horizontal slide transition between Groups sub-tabs (Communities/Guilds)
- **Button Press**: 0.95x scale on press with 100ms duration for tactile feedback

### Platform-Specific Adaptations

**Mobile (React Native)**
- Use native navigation patterns (stack, tab, modal)
- Implement pull-to-refresh on feed screens
- Use native keyboard handling
- Implement haptic feedback for interactions
- Support dark mode with system preference detection

**Web (Next.js)**
- Use hover states for interactive elements
- Implement keyboard shortcuts for power users
- Support browser back/forward navigation
- Use progressive enhancement for advanced features
- Implement proper SEO meta tags

### Performance Guidelines

**Image Optimization**
- Use Next.js Image component for web
- Implement lazy loading for feed images
- Compress images: JPEG for photos, PNG for graphics
- Use WebP format when supported
- Maximum image size: 2MB

**Loading States**
- Show skeleton screens for content loading
- Use progressive loading for feeds
- Implement optimistic updates for user actions
- Cache frequently accessed data
- Use virtual scrolling for long lists

**Bundle Optimization**
- Code splitting by route and feature
- Lazy load non-critical components
- Tree shake unused dependencies
- Minimize bundle size: Target <250KB initial load
- Use service workers for caching

### Content Guidelines

**Post Types Visual Indicators**
- Win posts: Green accent with trophy icon
- Project posts: Blue accent with code icon
- Question posts: Orange accent with question mark icon
- Anonymous posts: Gray accent with mask icon

**Status Indicators**
- Online status: Green dot
- Verified user: Blue checkmark badge
- Guild admin: Crown icon
- Community moderator: Shield icon
- College verified: University icon

**Empty States**
- Use friendly illustrations
- Provide clear next steps
- Include relevant call-to-action buttons
- Maintain consistent tone and voice

## Development Workflow & Tooling

### Living Design System with Storybook

To ensure consistency and accelerate development, we will build and maintain a Living Design System using Storybook.

**Implementation Strategy:**
- **Component Development**: All UI components will be developed in isolation using Storybook
- **Documentation**: Storybook serves as the single source of truth for component specifications
- **Testing**: Visual regression testing and accessibility checks run on every component
- **Collaboration**: Shared library for designers and developers to reference and contribute

**Storybook Structure:**
```
stories/
├── foundations/
│   ├── Colors.stories.tsx
│   ├── Typography.stories.tsx
│   └── Spacing.stories.tsx
├── components/
│   ├── Button.stories.tsx
│   ├── PostCard.stories.tsx
│   └── UserProfile.stories.tsx
├── patterns/
│   ├── OnboardingFlow.stories.tsx
│   ├── FeedWithFilters.stories.tsx
│   └── ElectionVotingInterface.stories.tsx
└── pages/
    ├── FeedScreen.stories.tsx
    ├── ProfileScreen.stories.tsx
    └── CommunityDetail.stories.tsx
```

**Benefits:**
- **Single Source of Truth**: Live, interactive documentation eliminates outdated specs
- **Efficient Development**: Build and test components without running full application
- **Automated Testing**: Visual regression and accessibility testing on every component
- **Team Collaboration**: Centralized library for design and development alignment

### Quality Assurance & Automation

**Accessibility Enforcement:**
- Automated accessibility checks in CI/CD pipeline using axe-core
- Manual accessibility testing with screen readers
- Color contrast validation on every component

**Performance Monitoring:**
- Performance budgets monitored using Lighthouse reports
- Automated performance testing on every pull request
- Bundle size analysis and optimization alerts

**Visual Consistency:**
- Chromatic for visual regression testing
- Design token validation in build process
- Component API consistency checks

### Design System Governance

**Component Lifecycle:**
1. **Proposal**: New component needs identified and documented
2. **Design**: Component designed in Figma with all states defined
3. **Development**: Component built in Storybook with full documentation
4. **Review**: Design and development review for consistency
5. **Testing**: Automated and manual testing completion
6. **Release**: Component added to design system library
7. **Maintenance**: Regular updates and deprecation management

**Documentation Standards:**
- Every component must have Storybook documentation
- All component states explicitly documented and implemented
- Usage guidelines and best practices included
- Accessibility considerations documented

This comprehensive UI guide ensures consistent, accessible, and user-friendly interfaces across both mobile and web platforms while maintaining Ascend's student-focused design philosophy. 