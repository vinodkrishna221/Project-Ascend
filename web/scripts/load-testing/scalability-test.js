// Scalability Testing for High-Volume Signup Periods
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Scalability metrics
const signupRate = new Rate('signup_success_rate');
const signupResponseTime = new Trend('signup_response_time');
const concurrentSignups = new Counter('concurrent_signups');
const systemLoad = new Gauge('system_load');
const databaseConnections = new Gauge('database_connections');

export const options = {
  scenarios: {
    // Peak signup period simulation (e.g., college admission results day)
    peak_signup_period: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      stages: [
        { duration: '1m', target: 10 },   // Warm up: 10 signups/sec
        { duration: '2m', target: 50 },   // Normal load: 50 signups/sec
        { duration: '3m', target: 100 },  // High load: 100 signups/sec
        { duration: '5m', target: 200 },  // Peak load: 200 signups/sec
        { duration: '2m', target: 500 },  // Extreme peak: 500 signups/sec
        { duration: '3m', target: 500 },  // Sustained peak
        { duration: '2m', target: 100 },  // Cool down
        { duration: '2m', target: 0 },    // End
      ],
      preAllocatedVUs: 100,
      maxVUs: 1000,
    },
    
    // Sustained high load
    sustained_high_load: {
      executor: 'constant-arrival-rate',
      rate: 150, // 150 signups per second
      timeUnit: '1s',
      duration: '15m',
      preAllocatedVUs: 200,
      maxVUs: 500,
    },
    
    // Burst traffic simulation
    burst_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 0 },
        { duration: '10s', target: 500 },  // Sudden burst
        { duration: '1m', target: 500 },   // Sustained burst
        { duration: '30s', target: 0 },    // Sudden drop
        { duration: '30s', target: 0 },
        { duration: '10s', target: 300 },  // Another burst
        { duration: '1m', target: 300 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  
  thresholds: {
    // Scalability benchmarks
    signup_success_rate: ['rate>0.95'],        // 95% success rate
    signup_response_time: [
      'p(50)<1000',   // 50% under 1s
      'p(90)<3000',   // 90% under 3s
      'p(95)<5000',   // 95% under 5s
      'p(99)<10000',  // 99% under 10s
    ],
    http_req_failed: ['rate<0.05'],            // Less than 5% failures
    http_req_duration: ['p(95)<5000'],         // 95% under 5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const scenario = __ENV.SCALABILITY_SCENARIO || 'full_signup_flow';
  
  switch (scenario) {
    case 'email_verification_only':
      testEmailVerificationScalability();
      break;
    case 'college_database_only':
      testCollegeDatabaseScalability();
      break;
    case 'mixed_verification':
      testMixedVerificationScalability();
      break;
    default:
      testFullSignupFlow();
  }
  
  // Random sleep to simulate realistic user behavior
  sleep(Math.random() * 2);
}

function testFullSignupFlow() {
  const userId = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const email = `${userId}@testcollege.edu`;
  
  concurrentSignups.add(1);
  
  // Step 1: Email verification initiation
  const step1Start = Date.now();
  const emailVerifyResponse = http.post(`${BASE_URL}/api/v1/auth/verify-email`,
    JSON.stringify({
      email: email,
      role: Math.random() > 0.8 ? 'aspirant' : 'student' // 80% students, 20% aspirants
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );
  
  const step1Duration = Date.now() - step1Start;
  signupResponseTime.add(step1Duration);
  
  const step1Success = check(emailVerifyResponse, {
    'email verification initiated': (r) => r.status === 200,
    'email verification response time acceptable': (r) => r.timings.duration < 5000,
  });
  
  if (!step1Success) {
    signupRate.add(0);
    return;
  }
  
  // Step 2: Simulate user delay (reading email, entering code)
  sleep(Math.random() * 3 + 1); // 1-4 seconds
  
  // Step 3: Code verification
  const step2Start = Date.now();
  const codeVerifyResponse = http.post(`${BASE_URL}/api/v1/auth/verify-code`,
    JSON.stringify({
      email: email,
      code: '123456' // Mock code
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );
  
  const step2Duration = Date.now() - step2Start;
  signupResponseTime.add(step2Duration);
  
  // Step 4: Check colleges list (common user action)
  const step3Start = Date.now();
  const collegesResponse = http.get(`${BASE_URL}/api/v1/colleges`, {
    timeout: '10s',
  });
  
  const step3Duration = Date.now() - step3Start;
  signupResponseTime.add(step3Duration);
  
  const totalDuration = step1Duration + step2Duration + step3Duration;
  const overallSuccess = check({}, {
    'full signup flow completed': () => 
      emailVerifyResponse.status === 200 && 
      collegesResponse.status === 200,
    'total flow time acceptable': () => totalDuration < 15000, // 15 seconds max
  });
  
  signupRate.add(overallSuccess ? 1 : 0);
  systemLoad.add(totalDuration);
}

function testEmailVerificationScalability() {
  const email = `test_${Date.now()}_${Math.floor(Math.random() * 10000)}@testcollege.edu`;
  
  concurrentSignups.add(1);
  
  const start = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/auth/verify-email`,
    JSON.stringify({
      email: email,
      role: 'student'
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '15s',
    }
  );
  
  const duration = Date.now() - start;
  signupResponseTime.add(duration);
  
  const success = check(response, {
    'email verification scales': (r) => r.status === 200,
    'email verification performance': (r) => r.timings.duration < 3000,
    'email verification has proper response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.success === 'boolean';
      } catch (e) {
        return false;
      }
    },
  });
  
  signupRate.add(success ? 1 : 0);
  systemLoad.add(duration);
}

function testCollegeDatabaseScalability() {
  const credentials = {
    college_id: 'test-college-id',
    student_name: `Test Student ${Math.floor(Math.random() * 10000)}`,
    branch: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'][Math.floor(Math.random() * 3)],
    year: 2020 + Math.floor(Math.random() * 5),
    verification_password: `testpass${Math.floor(Math.random() * 10000)}`,
  };
  
  concurrentSignups.add(1);
  
  const start = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/auth/verify-college-credentials`,
    JSON.stringify(credentials),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '20s',
    }
  );
  
  const duration = Date.now() - start;
  signupResponseTime.add(duration);
  databaseConnections.add(1);
  
  const success = check(response, {
    'college database verification scales': (r) => r.status >= 200 && r.status < 500,
    'college database performance': (r) => r.timings.duration < 5000,
    'college database response structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.success === 'boolean';
      } catch (e) {
        return false;
      }
    },
  });
  
  signupRate.add(success ? 1 : 0);
  systemLoad.add(duration);
}

function testMixedVerificationScalability() {
  // Randomly choose verification method (70% email, 30% college database)
  if (Math.random() > 0.3) {
    testEmailVerificationScalability();
  } else {
    testCollegeDatabaseScalability();
  }
  
  // Add some additional load with auxiliary requests
  if (Math.random() > 0.5) {
    // Simulate user browsing colleges
    http.get(`${BASE_URL}/api/v1/colleges`, { timeout: '5s' });
  }
  
  if (Math.random() > 0.7) {
    // Simulate domain request
    http.post(`${BASE_URL}/api/v1/domains/request`,
      JSON.stringify({
        college_name: `Test College ${Math.floor(Math.random() * 1000)}`,
        domain: `test${Math.floor(Math.random() * 1000)}.edu`,
        contact_email: `admin${Math.floor(Math.random() * 1000)}@example.com`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '10s',
      }
    );
  }
}

// Setup and teardown functions
export function setup() {
  console.log('Starting scalability test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test scenario: ${__ENV.SCALABILITY_SCENARIO || 'full_signup_flow'}`);
  
  // Warm up the system
  const warmupResponse = http.get(`${BASE_URL}/api/v1/colleges`);
  if (warmupResponse.status !== 200) {
    console.warn('Warmup request failed, system might not be ready');
  }
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Scalability test completed in ${duration} seconds`);
}