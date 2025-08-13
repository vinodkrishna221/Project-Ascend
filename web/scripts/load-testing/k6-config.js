// K6 Load Testing Configuration for Authentication Flow
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const authResponseTime = new Trend('auth_response_time');
export const verificationAttempts = new Counter('verification_attempts');
export const concurrentUsers = new Counter('concurrent_users');

// Test configuration
export const options = {
  scenarios: {
    // Concurrent verification scenario
    concurrent_verification: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    
    // High-volume signup scenario
    high_volume_signup: {
      executor: 'constant-arrival-rate',
      rate: 30, // 30 signups per second
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    
    // Stress testing scenario
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      stages: [
        { duration: '2m', target: 10 },   // Start with 10 req/s
        { duration: '5m', target: 50 },   // Ramp to 50 req/s
        { duration: '2m', target: 100 },  // Ramp to 100 req/s
        { duration: '5m', target: 100 },  // Stay at 100 req/s
        { duration: '2m', target: 200 },  // Spike to 200 req/s
        { duration: '3m', target: 200 },  // Stay at spike
        { duration: '2m', target: 0 },    // Ramp down
      ],
      preAllocatedVUs: 100,
      maxVUs: 500,
    },
  },
  
  thresholds: {
    // Performance benchmarks
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    auth_response_time: ['p(90)<1000'], // 90% of auth requests under 1s
    errors: ['rate<0.1'],              // Error rate under 10%
  },
};

// Test data generators
export function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return {
    email: `test.user.${timestamp}.${random}@testcollege.edu`,
    name: `Test User ${random}`,
    password: 'TestPassword123!',
    college_id: 'test-college-id',
  };
}

export function generateCollegeCredentials() {
  const random = Math.floor(Math.random() * 10000);
  
  return {
    college_id: 'test-college-id',
    student_name: `Test Student ${random}`,
    branch: 'Computer Science',
    year: 2024,
    verification_password: `testpass${random}`,
  };
}

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export { BASE_URL };