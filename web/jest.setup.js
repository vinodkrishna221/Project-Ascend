// Jest setup file for authentication tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock crypto for Node.js environment
const crypto = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
  },
});

// Setup test database cleanup
afterEach(() => {
  jest.clearAllMocks();
});