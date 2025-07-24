# Ascend - Student Social Network

> A dedicated social network designed exclusively for students - a platform where they can confidently share their academic journey, showcase projects, celebrate achievements, and build meaningful connections with peers across colleges.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## 🎯 Mission Statement

Ascend is a student-only social network designed to create a safe, supportive environment where students can confidently share their academic journey, showcase projects, celebrate achievements, and build meaningful cross-college connections without the intimidation factor of professional networks.

## 🚀 The Problem We Solve

Students face significant barriers in showcasing their academic growth and building meaningful professional networks:

- **Confidence Gap**: Students hesitate to post small projects or course certificates on LinkedIn, fearing they're not 'big enough' for a platform dominated by established professionals
- **Collaboration Friction**: Difficulty finding complementary skills across colleges for project collaboration
- **Authenticity Problem**: College aspirants can't access authentic, unvarnished opinions from current students about real campus experiences
- **Portfolio Fragmentation**: Students' achievements are scattered across different platforms with no unified professional identity

## 👥 Target Audience

### Primary Users
- **College Students**: Current university/college students sharing projects, seeking collaboration, and building networks
- **College Aspirants**: 12th grade students researching colleges and connecting with current students

### Secondary Users
- **Student Council Leaders**: Managing college guilds and organizing events
- **Recruiters**: Finding qualified student candidates through verified skills and projects

## ✨ Key Features

### MVP Core Features
- **Student Onboarding**: Separate paths for students vs aspirants with college email verification
- **Basic Profiles**: Student identity with skills, interests, and verification badges
- **The Feed & Posts**: Central hub for sharing Wins, Project Updates, and Questions
- **Communities**: Topic-based groups for cross-college connections
- **College Guilds**: Official college hubs managed by student councils
- **Anonymous Mode**: Safe space for honest questions

### Future Features
- **Digital College Elections**: Transparent, secure voting system for student councils
- **Project Collaboration Boards**: Skill-based team formation for projects
- **Mentorship Matching**: Structured senior-junior connections
- **Verified Skill Endorsements**: Project-linked skill verification
- **Community-Verified Credentials**: Badges earned through challenges
- **Ascend Internship Platform**: Advanced recruitment portal

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- **Web**: Next.js with TypeScript (SSR for SEO-friendly profiles)
- **Mobile**: React Native with TypeScript (Primary platform)
- **State Management**: Zustand (Primary) or Redux Toolkit
- **UI Framework**: Tailwind CSS + Headless UI

**Backend:**
- **Backend-as-a-Service**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with college email verification
- **Real-time**: PostgreSQL change data capture for live features
- **File Storage**: S3-compatible storage with CDN
- **Edge Functions**: Serverless functions for custom business logic

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile App    │
│   (Next.js)     │    │ (React Native)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
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

## 📁 Project Structure

```
ascend/
├── web/                          # Next.js Web Application
│   ├── src/
│   │   ├── components/          # Feature-based components
│   │   ├── pages/               # Next.js pages/routes
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API and external services
│   │   ├── utils/               # Helper functions
│   │   ├── store/               # State management (Zustand)
│   │   └── styles/              # Global styles and themes
│   └── supabase/               # Supabase configuration
├── mobile/                       # React Native Mobile App
│   ├── src/
│   │   ├── components/         # Mobile-specific components
│   │   ├── screens/            # Screen components
│   │   ├── navigation/         # React Navigation setup
│   │   ├── services/           # Shared services with web
│   │   └── store/              # Shared state management
│   ├── android/                # Android-specific files
│   └── ios/                    # iOS-specific files
├── shared/                       # Shared code between platforms
│   ├── types/                  # Common TypeScript types
│   ├── constants/              # Shared constants
│   ├── utils/                  # Shared utility functions
│   └── services/               # Shared service logic
├── docs/                        # Documentation
├── scripts/                     # Build and utility scripts
└── .kiro/                       # Kiro configuration and specs
```

## 🔐 Security & Privacy

### Core Security Principles
1. **Student-Only Verification**: Mandatory college email verification for all accounts
2. **Privacy by Design**: Minimal data collection with clear purpose and user control
3. **Proactive Safety**: AI-powered content moderation with human oversight
4. **Data Sovereignty**: Students own their data and content

### Authentication Methods
- **Primary**: College email verification with approved domain checking
- **Alternative**: College database verification for institutions without email systems
- **Ongoing**: Email verification renewal every 6 months with automatic verification for active .edu domains

### Data Protection
- **GDPR Compliance**: Full compliance for EU students with data subject rights
- **FERPA Considerations**: Educational record protection for US students
- **Anonymous Posting**: Secure anonymous posting system with privacy protections
- **Content Moderation**: Multi-stage AI and human moderation pipeline

## 🎨 User Experience Philosophy

### Core UX Principles
1. **Student-First Design**: Age-appropriate, encouraging, non-intimidating interfaces
2. **Confidence Building**: Celebrate small achievements with meaningful feedback
3. **Authentic Connection**: Facilitate genuine peer relationships over networking
4. **Progressive Disclosure**: Start simple, reveal complexity as users grow
5. **Mobile-First Empathy**: Optimized for interrupted, one-handed usage patterns

### Key Interaction Patterns
- **Kudos System**: Meaningful positive reinforcement with haptic feedback
- **Post Creation Flow**: Confidence-building journey from anxiety to excitement
- **Anonymous Questions**: Psychological safety for vulnerable content
- **Collaboration Discovery**: Frictionless cross-college project matching

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase CLI
- React Native development environment (for mobile)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ascend.git
cd ascend
```

2. **Install dependencies**
```bash
# Web application
cd web
npm install

# Mobile application
cd ../mobile
npm install
```

3. **Set up Supabase**
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Start local Supabase instance
supabase start

# Generate TypeScript types
supabase gen types typescript > shared/types/database.ts
```

4. **Environment Configuration**
```bash
# Copy environment template
cp web/.env.example web/.env.local

# Add your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Run the applications**
```bash
# Web application
cd web
npm run dev

# Mobile application (in another terminal)
cd mobile
npm run android  # or npm run ios
```

### Common Commands

```bash
# Database operations
supabase db diff             # Generate migration from schema changes
supabase db push             # Push migrations to remote
supabase db pull             # Pull schema from remote

# Supabase management
supabase functions new <name> # Create new Edge Function
supabase functions deploy     # Deploy Edge Functions

# Testing and deployment
npm test                     # Run test suite
npm run build               # Build for production
npm run lint                # Check code quality
```

## 📊 Success Metrics

### MVP Success Indicators
- **Weekly Active Posters**: 10% of active users posting at least once per week
- **Activation Rate**: 60% of new users join at least one Community within 3 days
- **Engagement Rate**: Average of 3+ meaningful comments per post
- **Retention Rate**: 40% Day-7 retention for new users
- **Product Quality**: 4.5+ star rating in App/Play Store

### Long-term Goals
- Become the primary platform for every student in India from college research to first job
- Enable authentic skill verification through project collaboration
- Create the largest verified student network in the country
- Achieve 1M+ verified student users across 500+ colleges by Year 2

## 💰 Monetization Strategy

### Primary Revenue Stream
- **B2B Subscriptions**: Companies and recruiters pay for access to "Ascend Internship Platform"
  - Basic Plan: $99/month
  - Premium Plan: $299/month
  - Enterprise Plan: $999/month

### Secondary Revenue Streams
- **Sponsored Content**: Company-hosted challenges and workshops
- **Premium Features**: Advanced analytics and enhanced customization
- **Certification Programs**: Partner with educational institutions

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. **Spec-Driven Development**: Always create detailed specs before coding
2. **Feature-Based Organization**: Group code by features, not file types
3. **TypeScript Strict Mode**: No `any` types allowed
4. **Accessibility First**: WCAG 2.1 AA compliance required
5. **Student-First Always**: Every decision must prioritize student well-being

### Code Quality Standards
- 80%+ test coverage for critical features
- ESLint + Prettier configuration compliance
- Comprehensive error handling and logging
- Performance requirements: <3s page load, <500ms API response

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [docs](docs/) folder for detailed guides
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/yourusername/ascend/issues)
- **Community**: Join our development discussions

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com/) for backend infrastructure
- UI components powered by [Tailwind CSS](https://tailwindcss.com/)
- Mobile development with [React Native](https://reactnative.dev/)
- Web application built with [Next.js](https://nextjs.org/)

---

**Remember**: Every decision, every line of code, every design choice must pass this test: *"Does this help students feel more confident, connected, and supported in their academic journey?"*

If the answer is not a clear "yes," we reconsider the approach. Our mission is to empower students, not exploit them. Our success is measured by their growth, confidence, and authentic connections.