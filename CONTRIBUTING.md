# Contributing to Ascend

Thank you for your interest in contributing to Ascend! This document provides guidelines and information for contributors.

## 🎯 Our Mission

Ascend is a student-only social network designed to create a safe, supportive environment where students can confidently share their academic journey. Every contribution must align with our core principle: **Student-First Always**.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase CLI
- Git
- React Native development environment (for mobile contributions)

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ascend.git`
3. Follow the setup instructions in the main README.md
4. Create a new branch: `git checkout -b feature/your-feature-name`

## 📋 Development Workflow (MANDATORY)

### Spec-Driven Development
**NEVER write code without a spec. ALWAYS follow this workflow:**

1. **Requirements Phase**: Create detailed `requirements.md` with user stories and EARS format acceptance criteria
2. **Design Phase**: Develop comprehensive `design.md` with architecture, components, and technical decisions
3. **Implementation Phase**: Create actionable `tasks.md` with specific coding tasks that reference requirements
4. **Code Phase**: Only then implement code following the established spec

### File Structure Compliance (STRICT)
All code must follow the established project structure:
- Group by FEATURE, not file type
- Use PascalCase for React components
- Use camelCase for hooks, services, utilities
- Use kebab-case for API endpoints and file names
- Use UPPER_SNAKE_CASE for constants

## 🛠️ Code Quality Standards

### TypeScript Requirements
- TypeScript STRICT mode - NO `any` types allowed
- Generate types from Supabase schema: `supabase gen types typescript`
- Use discriminated unions for complex types
- Implement proper error types: `Result<T, Error>` pattern

### Testing Requirements
- 80%+ test coverage for critical features
- Unit tests for business logic (Jest)
- Component tests for UI interactions (React Testing Library)
- Integration tests for API endpoints
- Accessibility tests (axe-core)
- Performance tests (Lighthouse)

### Performance Requirements (NON-NEGOTIABLE)
- Page load time: < 3 seconds on 3G networks
- API response time: < 500ms for most endpoints
- Mobile app startup: < 2 seconds cold start
- Image optimization: WebP format, lazy loading
- Bundle size: < 250KB initial load for web

## 🎨 User Experience Standards

### Core UX Principles (MANDATORY)
Every interface must demonstrate:
1. **Student-First Design**: Age-appropriate, encouraging, non-intimidating
2. **Confidence Building**: Celebrate small wins, provide positive reinforcement
3. **Authentic Connection**: Facilitate genuine relationships over networking
4. **Progressive Disclosure**: Start simple, reveal complexity gradually
5. **Mobile-First Empathy**: Optimize for interrupted, one-handed usage

### Interaction Design Requirements
All user interactions must include:
- Loading states with encouraging messages
- Success states with celebration animations
- Error states with helpful, non-punitive guidance
- Empty states with clear next steps
- Accessibility support (screen readers, keyboard navigation)

## 🔒 Security Requirements (MANDATORY)

### Supabase Integration
- Use Row Level Security (RLS) policies for data access
- Implement proper TypeScript types from generated schema
- Use real-time subscriptions for live features
- Follow proper error handling patterns
- Maintain data consistency across platforms

### Security Standards
- College email verification for all student accounts
- JWT token management with refresh rotation
- Input validation on both client and server
- HTTPS everywhere, no exceptions
- Regular security audits and dependency updates

## 📝 Pull Request Process

### Before Submitting
1. Ensure your code follows the established file structure
2. Write comprehensive tests with 80%+ coverage
3. Run all linters and fix any issues: `npm run lint`
4. Test on both mobile and web platforms
5. Verify accessibility compliance
6. Update documentation if needed

### PR Requirements
Your PR must include:
- [ ] Follows established file structure and naming conventions
- [ ] Implements required UX patterns and accessibility features
- [ ] Includes comprehensive TypeScript types
- [ ] Has appropriate test coverage
- [ ] Follows Supabase integration patterns
- [ ] Meets performance requirements
- [ ] Includes proper error handling
- [ ] Maintains student-first design principles

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Student Impact
How does this change help students feel more confident, connected, and supported?

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Accessibility tests passed
- [ ] Performance tests passed
- [ ] Manual testing completed

## Screenshots/Videos
(If applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
```

## 🚫 Prohibited Features & Patterns

**NEVER implement these:**
- Vanity metrics that create unhealthy competition
- Addictive engagement loops or dark patterns
- Features that compromise student privacy
- Complex interfaces that intimidate new users
- Professional networking features that feel corporate
- Monetization that exploits student data

## ✅ Required Feature Patterns

**ALWAYS implement these patterns:**
- Progressive disclosure (simple → advanced)
- Encouraging micro-interactions and feedback
- Anonymous options for vulnerable content
- Mobile-first responsive design
- Offline-capable core features
- Clear privacy controls and data ownership

## 🎯 Feature Development Guidelines

### Student-Centric Feature Requirements
Every feature MUST address these questions:
1. How does this help students feel more confident sharing their work?
2. How does this facilitate authentic peer connections?
3. How does this maintain psychological safety?
4. How does this work on mobile-first usage patterns?

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Device/browser information
- Console errors (if any)

## 💡 Feature Requests

For new features, please provide:
- Clear problem statement
- Proposed solution
- Student impact assessment
- Technical considerations
- Mockups/wireframes (if applicable)

## 📚 Documentation

### Required Documentation
All features must include:
- Clear README with setup instructions
- API documentation with examples
- Component documentation in Storybook
- User-facing help documentation
- Technical decision records (ADRs)

## 🤝 Code Review Process

### Review Criteria
Code reviews will evaluate:
- Adherence to student-first principles
- Code quality and maintainability
- Performance and accessibility
- Security best practices
- Test coverage and quality
- Documentation completeness

### Review Timeline
- Initial review within 48 hours
- Follow-up reviews within 24 hours
- Approval requires 2 maintainer reviews

## 🏆 Recognition

Contributors who consistently deliver high-quality, student-focused features will be:
- Recognized in our contributor hall of fame
- Invited to join the core maintainer team
- Given priority for feature requests and suggestions

## 📞 Getting Help

- **Technical Questions**: Create a GitHub issue with the `question` label
- **Design Questions**: Tag `@ux-team` in your issue
- **Security Concerns**: Email security@ascend.dev (when available)
- **General Discussion**: Use GitHub Discussions

## 📄 License

By contributing to Ascend, you agree that your contributions will be licensed under the MIT License.

---

## Final Reminder: Student-First Always

Every contribution must pass this test: **"Does this help students feel more confident, connected, and supported in their academic journey?"**

If the answer is not a clear "yes," we reconsider the approach. Our mission is to empower students, not exploit them.

Thank you for helping us build a platform that truly serves the student community! 🎓✨