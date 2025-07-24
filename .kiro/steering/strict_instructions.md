# Ascend Project - Strict Instructions & Guidelines

## Project Context & Mission

### Core Mission Statement
Ascend is a student-only social network designed to create a safe, supportive environment where students can confidently share their academic journey, showcase projects, celebrate achievements, and build meaningful cross-college connections without the intimidation factor of professional networks.

### Non-Negotiable Principles
1. **Student-First Always**: Every decision must prioritize student well-being and authentic expression over business metrics
2. **Psychological Safety**: Create spaces where students feel safe to be vulnerable, ask questions, and share small wins
3. **Authentic Connection**: Facilitate genuine peer relationships, not superficial networking
4. **Verified Student Community**: Maintain strict college email verification to preserve student-only environment
5. **Ethical Design**: No dark patterns, addictive mechanics, or exploitative engagement strategies

## Development Workflow & Standards

### Spec-Driven Development (MANDATORY)
**NEVER write code without a spec. ALWAYS follow this workflow:**

1. **Requirements Phase**: Create detailed requirements.md with user stories and EARS format acceptance criteria
2. **Design Phase**: Develop comprehensive design.md with architecture, components, and technical decisions
3. **Implementation Phase**: Create actionable tasks.md with specific coding tasks that reference requirements
4. **Code Phase**: Only then implement code following the established spec

### File Structure Compliance (STRICT)
**ALL code must follow the established project structure:**

```
ascend/
├── web/                     # Next.js Web Application
├── mobile/                  # React Native Mobile App  
├── shared/                  # Shared code between platforms
├── docs/                    # Documentation
├── scripts/                 # Build and utility scripts
└── .kiro/                   # Kiro configuration and specs
```

**Component Organization Rules:**
- Group by FEATURE, not file type
- Use PascalCase for React components
- Use camelCase for hooks, services, utilities
- Use kebab-case for API endpoints and file names
- Use UPPER_SNAKE_CASE for constants

### Technology Stack Constraints (NON-NEGOTIABLE)

**Frontend Stack:**
- **Web**: Next.js with TypeScript (MANDATORY)
- **Mobile**: React Native with TypeScript (MANDATORY)
- **State Management**: Zustand (PRIMARY) or Redux Toolkit
- **UI Framework**: Tailwind CSS + Headless UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)

**Code Quality Requirements:**
- TypeScript STRICT mode - NO `any` types allowed
- 80%+ test coverage for critical features
- ESLint + Prettier configuration compliance
- Accessibility compliance (WCAG 2.1 AA minimum)

## Feature Development Guidelines

### Student-Centric Feature Requirements
**Every feature MUST address these questions:**
1. How does this help students feel more confident sharing their work?
2. How does this facilitate authentic peer connections?
3. How does this maintain psychological safety?
4. How does this work on mobile-first usage patterns?

### Prohibited Features & Patterns
**NEVER implement these:**
- Vanity metrics that create unhealthy competition
- Addictive engagement loops or dark patterns
- Features that compromise student privacy
- Complex interfaces that intimidate new users
- Professional networking features that feel corporate
- Monetization that exploits student data

### Required Feature Patterns
**ALWAYS implement these patterns:**
- Progressive disclosure (simple → advanced)
- Encouraging micro-interactions and feedback
- Anonymous options for vulnerable content
- Mobile-first responsive design
- Offline-capable core features
- Clear privacy controls and data ownership

## User Experience Standards (MANDATORY)

### Core UX Principles Compliance
**Every interface must demonstrate:**
1. **Student-First Design**: Age-appropriate, encouraging, non-intimidating
2. **Confidence Building**: Celebrate small wins, provide positive reinforcement
3. **Authentic Connection**: Facilitate genuine relationships over networking
4. **Progressive Disclosure**: Start simple, reveal complexity gradually
5. **Mobile-First Empathy**: Optimize for interrupted, one-handed usage

### Interaction Design Requirements
**All user interactions must include:**
- Loading states with encouraging messages
- Success states with celebration animations
- Error states with helpful, non-punitive guidance
- Empty states with clear next steps
- Accessibility support (screen readers, keyboard navigation)

### Animation & Feedback Standards
- Micro-interactions: 300ms maximum duration
- Success animations: Confetti or celebration patterns
- Button feedback: Haptic feedback on mobile, scale animations
- Loading: Skeleton screens, not spinners
- Transitions: Smooth, purposeful, never jarring

## Content & Communication Guidelines

### Tone & Voice Requirements
**All user-facing content must be:**
- Encouraging and supportive, never judgmental
- Age-appropriate for 18-25 year olds
- Inclusive and welcoming to all backgrounds
- Clear and jargon-free
- Confidence-building, not intimidating

### Content Moderation Standards
**Implement these safety measures:**
- AI-powered content filtering for inappropriate material
- Community reporting with clear escalation paths
- Protective moderation that feels supportive, not punitive
- Anonymous posting options with safety indicators
- Clear community guidelines prominently displayed

## Technical Implementation Standards

### Supabase Integration Requirements
**ALL database operations must:**
- Use Row Level Security (RLS) policies for data access
- Implement proper TypeScript types from generated schema
- Use real-time subscriptions for live features
- Follow proper error handling patterns
- Maintain data consistency across platforms

### Performance Requirements (NON-NEGOTIABLE)
- Page load time: < 3 seconds on 3G networks
- API response time: < 500ms for most endpoints
- Mobile app startup: < 2 seconds cold start
- Image optimization: WebP format, lazy loading
- Bundle size: < 250KB initial load for web

### Security Requirements (MANDATORY)
- College email verification for all student accounts
- JWT token management with refresh rotation
- Input validation on both client and server
- HTTPS everywhere, no exceptions
- Regular security audits and dependency updates

## Code Review & Quality Assurance

### Code Review Checklist (MANDATORY)
**Every PR must verify:**
- [ ] Follows established file structure and naming conventions
- [ ] Implements required UX patterns and accessibility features
- [ ] Includes comprehensive TypeScript types
- [ ] Has appropriate test coverage
- [ ] Follows Supabase integration patterns
- [ ] Meets performance requirements
- [ ] Includes proper error handling
- [ ] Maintains student-first design principles

### Testing Requirements
**All features must include:**
- Unit tests for business logic (Jest)
- Component tests for UI interactions (React Testing Library)
- Integration tests for API endpoints
- Accessibility tests (axe-core)
- Performance tests (Lighthouse)
- Cross-platform compatibility tests

## Deployment & Release Standards

### Environment Management
**Maintain these environments:**
- **Development**: Local development with Supabase local instance
- **Staging**: Full feature testing with production-like data
- **Production**: Live platform with monitoring and analytics

### Release Process (STRICT)
1. Feature development in feature branch
2. Comprehensive testing and code review
3. Staging deployment and QA testing
4. User acceptance testing with student feedback
5. Production deployment with monitoring
6. Post-release monitoring and feedback collection

## Error Handling & Monitoring

### Error Handling Standards
**All errors must:**
- Provide helpful, non-technical messages to users
- Include specific guidance for resolution
- Log detailed information for debugging
- Offer retry mechanisms where appropriate
- Maintain user context and progress

### Monitoring Requirements
**Track these metrics:**
- User engagement quality (not just quantity)
- Feature adoption and usage patterns
- Performance metrics and error rates
- Accessibility compliance and usage
- Student satisfaction and confidence building

## Communication & Collaboration

### Documentation Requirements
**All features must include:**
- Clear README with setup instructions
- API documentation with examples
- Component documentation in Storybook
- User-facing help documentation
- Technical decision records (ADRs)

### Team Communication Standards
- Use clear, specific commit messages
- Document all architectural decisions
- Share knowledge through code comments
- Conduct regular accessibility reviews
- Maintain open communication about UX concerns

## Compliance & Legal Considerations

### Student Data Protection
**MANDATORY requirements:**
- GDPR compliance for EU students
- FERPA considerations for educational data
- Clear privacy policies and data usage
- Student control over data sharing
- Regular data protection audits

### Platform Safety
**Required safety measures:**
- Content moderation systems
- User reporting mechanisms
- Crisis intervention protocols
- Mental health resource integration
- Clear community guidelines enforcement

## Success Metrics & KPIs

### Primary Success Indicators
**Measure these student-centric metrics:**
- First post completion rate (confidence building)
- Repeat posting behavior (sustained engagement)
- Anonymous to public posting progression (growing confidence)
- Cross-college collaboration initiation rate
- Community response quality and supportiveness

### Prohibited Metrics
**NEVER optimize for these:**
- Time spent on platform (addiction indicators)
- Infinite scroll engagement
- Vanity metrics (likes, followers without context)
- Competitive ranking systems
- Metrics that encourage unhealthy behavior

## Emergency Procedures

### Critical Issue Response
**For platform safety issues:**
1. Immediate content removal if harmful
2. User safety assessment and support
3. Community notification if needed
4. Root cause analysis and prevention
5. Policy updates to prevent recurrence

### Technical Emergency Response
**For system failures:**
1. Immediate user notification with transparency
2. Fallback to core functionality
3. Data integrity verification
4. Service restoration with monitoring
5. Post-incident review and improvements

---

## Final Reminder: Student-First Always

Every decision, every line of code, every design choice must pass this test: **"Does this help students feel more confident, connected, and supported in their academic journey?"**

If the answer is not a clear "yes," reconsider the approach. Our mission is to empower students, not exploit them. Our success is measured by their growth, confidence, and authentic connections—not by engagement metrics or revenue alone.

**When in doubt, choose the path that best serves student well-being and authentic expression.**