# Authentication System Test Suite

This directory contains a comprehensive test suite for the Ascend authentication system, covering all aspects of authentication services and utilities.

## Test Structure

### 1. Unit Tests (`*.test.ts`)
- **Purpose**: Test individual functions and services in isolation
- **Coverage**: All authentication services, utilities, and helper functions
- **Files**:
  - `auth.service.comprehensive.test.ts` - Core authentication service tests
  - `email-verification.service.test.ts` - Email verification functionality
  - `college-database-verification.service.test.ts` - College database verification
  - `jwt-token.service.test.ts` - JWT token management
  - `role-management.test.ts` - Role-based access control

### 2. Integration Tests (`*.integration.test.ts`)
- **Purpose**: Test complete authentication flows and service interactions
- **Coverage**: End-to-end authentication scenarios
- **Files**:
  - `auth.integration.test.ts` - Complete authentication flow testing

### 3. End-to-End Tests (`*.e2e.test.ts`)
- **Purpose**: Test user journeys from UI to database
- **Coverage**: API endpoints, user flows, and system integration
- **Files**:
  - `auth.e2e.test.ts` - Complete user journey validation

### 4. Security Tests (`*.security.test.ts`)
- **Purpose**: Test security measures and vulnerability assessment
- **Coverage**: Input validation, authentication security, token security
- **Files**:
  - `auth.security.test.ts` - Comprehensive security testing

## Running Tests

### Quick Start
```bash
# Run all authentication tests
npm run test:auth

# Run specific test types
npm run test:auth:unit
npm run test:auth:integration
npm run test:auth:e2e
npm run test:auth:security

# Watch mode for development
npm run test:auth:watch
```

### Individual Test Commands
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Security tests only
npm run test:security

# All tests with coverage
npm run test:coverage

# CI/CD pipeline tests
npm run test:ci
```

## Test Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Reports
- HTML report: `coverage/lcov-report/index.html`
- JSON summary: `coverage/coverage-summary.json`
- Text output: Console during test execution

## Test Categories

### Authentication Service Tests
- User signup (student and aspirant)
- Email verification flow
- College database verification
- Login and logout
- Token refresh
- Password reset
- Role assignment

### Email Verification Tests
- Code generation and validation
- Rate limiting
- Expiration handling
- Cleanup processes
- Email sending service

### College Database Verification Tests
- Credential validation
- Password hashing and comparison
- Duplicate prevention
- Student record management
- Admin operations

### JWT Token Tests
- Token generation and validation
- Signature verification
- Expiration handling
- Claims validation
- Token revocation

### Role Management Tests
- Role assignment and updates
- Permission checking
- Access control enforcement
- Role transitions
- Guild admin designation

### Security Tests
- Input validation and sanitization
- SQL injection prevention
- XSS attack prevention
- Brute force protection
- Rate limiting
- Session security
- CSRF protection
- Audit logging

## Mock Strategy

### External Dependencies
- **Supabase**: Mocked with realistic response structures
- **bcrypt**: Mocked for password hashing operations
- **JWT**: Mocked for token operations
- **Email Service**: Mocked for email sending
- **Database**: Mocked with test data

### Mock Data
- Test users with various roles and verification states
- College data with different verification types
- Verification codes and tokens
- Error scenarios and edge cases

## Test Data

### Test Users
```typescript
const testUsers = {
  student: {
    name: 'John Doe',
    email: 'john@mit.edu',
    role: 'student',
    verification_method: 'email'
  },
  aspirant: {
    name: 'Jane Smith',
    email: 'jane@gmail.com',
    role: 'aspirant',
    verification_method: 'email'
  },
  dbStudent: {
    name: 'Rahul Patel',
    collegeId: 'iit-delhi',
    branch: 'Computer Science',
    year: 2024,
    verification_method: 'college_database'
  }
};
```

### Test Colleges
```typescript
const testColleges = [
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    domain: 'mit.edu',
    verification_type: 'automatic',
    provides_email: true
  },
  {
    id: 'iit-delhi',
    name: 'Indian Institute of Technology Delhi',
    domain: null,
    verification_type: 'database_only',
    provides_email: false
  }
];
```

## Error Scenarios

### Validation Errors
- Invalid email formats
- Weak passwords
- Missing required fields
- Invalid college IDs
- Malformed request data

### Authentication Errors
- Invalid credentials
- Expired verification codes
- Maximum attempts exceeded
- Account locked
- Suspicious activity

### System Errors
- Database connection failures
- Email service unavailable
- Network timeouts
- Rate limiting
- Service unavailable

## Performance Testing

### Load Testing Scenarios
- Concurrent verification requests
- High-volume signup periods
- Database query performance
- Token validation speed
- Email sending capacity

### Performance Benchmarks
- Email verification: < 30 seconds end-to-end
- Code validation: < 500ms response time
- Token refresh: < 200ms response time
- Database verification: < 1 second response time

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Authentication Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
```

### Test Reports
- JUnit XML for CI integration
- Coverage reports for code quality
- Performance metrics tracking
- Security scan results

## Debugging Tests

### Common Issues
1. **Mock not working**: Check mock implementation and imports
2. **Async test failures**: Ensure proper await/Promise handling
3. **Database errors**: Verify mock data structure
4. **Timeout errors**: Increase test timeout for slow operations

### Debug Commands
```bash
# Run tests with verbose output
npm run test:auth -- --verbose

# Run specific test file
npm run test:auth -- --testNamePattern="signup"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Contributing

### Adding New Tests
1. Follow existing naming conventions
2. Include comprehensive test cases
3. Mock external dependencies properly
4. Add appropriate documentation
5. Ensure coverage thresholds are met

### Test Guidelines
- Write descriptive test names
- Test both success and failure scenarios
- Include edge cases and boundary conditions
- Mock external dependencies consistently
- Follow AAA pattern (Arrange, Act, Assert)

### Code Review Checklist
- [ ] All test cases pass
- [ ] Coverage thresholds met
- [ ] Security tests included
- [ ] Error scenarios covered
- [ ] Performance considerations addressed
- [ ] Documentation updated

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Security Testing Guidelines](https://owasp.org/www-project-web-security-testing-guide/)

## Support

For questions about the test suite:
1. Check existing test files for examples
2. Review this documentation
3. Check the main authentication service documentation
4. Create an issue for test-specific problems