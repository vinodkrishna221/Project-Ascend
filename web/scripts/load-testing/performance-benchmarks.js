// Performance Benchmarks and Response Time Validation
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Rate, Counter } from 'k6/metrics';

// Performance metrics
const responseTime = new Trend('response_time');
const errorRate = new Rate('error_rate');
const throughput = new Counter('throughput');

export const options = {
  scenarios: {
    // Response time validation
    response_time_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
    },
    
    // Throughput testing
    throughput_test: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 requests per second
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
  
  thresholds: {
    // Performance benchmarks
    response_time: [
      'p(50)<500',   // 50% of requests under 500ms
      'p(90)<1000',  // 90% of requests under 1s
      'p(95)<2000',  // 95% of requests under 2s
      'p(99)<5000',  // 99% of requests under 5s
    ],
    error_rate: ['rate<0.05'], // Error rate under 5%
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const testType = __ENV.TEST_TYPE || 'all';
  
  switch (testType) {
    case 'auth_endpoints':
      testAuthEndpoints();
      break;
    case 'verification_flow':
      testVerificationFlow();
      break;
    case 'database_operations':
      testDatabaseOperations();
      break;
    case 'file_operations':
      testFileOperations();
      break;
    default:
      testAllEndpoints();
  }
  
  sleep(0.1);
}

function testAuthEndpoints() {
  const endpoints = [
    {
      name: 'verify-email',
      url: `${BASE_URL}/api/v1/auth/verify-email`,
      method: 'POST',
      body: JSON.stringify({
        email: `test${Date.now()}@testcollege.edu`,
        role: 'student'
      }),
      expectedTime: 500, // 500ms benchmark
    },
    {
      name: 'verify-code',
      url: `${BASE_URL}/api/v1/auth/verify-code`,
      method: 'POST',
      body: JSON.stringify({
        email: `test${Date.now()}@testcollege.edu`,
        code: '123456'
      }),
      expectedTime: 300, // 300ms benchmark
    },
    {
      name: 'refresh-token',
      url: `${BASE_URL}/api/v1/auth/refresh-token`,
      method: 'POST',
      body: JSON.stringify({
        refresh_token: 'mock-token'
      }),
      expectedTime: 200, // 200ms benchmark
    },
    {
      name: 'verification-status',
      url: `${BASE_URL}/api/v1/auth/verification-status`,
      method: 'GET',
      expectedTime: 100, // 100ms benchmark
    },
  ];
  
  endpoints.forEach(endpoint => {
    const start = Date.now();
    const response = http.request(endpoint.method, endpoint.url, endpoint.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    });
    
    const duration = Date.now() - start;
    responseTime.add(duration);
    throughput.add(1);
    
    const success = check(response, {
      [`${endpoint.name} status ok`]: (r) => r.status >= 200 && r.status < 500,
      [`${endpoint.name} response time < ${endpoint.expectedTime}ms`]: () => duration < endpoint.expectedTime,
      [`${endpoint.name} has response body`]: (r) => r.body && r.body.length > 0,
    });
    
    if (!success) {
      errorRate.add(1);
      console.error(`${endpoint.name} failed: ${response.status} - ${response.body}`);
    }
  });
}

function testVerificationFlow() {
  const email = `test${Date.now()}@testcollege.edu`;
  
  // Step 1: Email verification
  const step1Start = Date.now();
  const step1Response = http.post(`${BASE_URL}/api/v1/auth/verify-email`,
    JSON.stringify({ email, role: 'student' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const step1Duration = Date.now() - step1Start;
  
  // Step 2: Code verification
  sleep(0.1);
  const step2Start = Date.now();
  const step2Response = http.post(`${BASE_URL}/api/v1/auth/verify-code`,
    JSON.stringify({ email, code: '123456' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const step2Duration = Date.now() - step2Start;
  
  // Step 3: Status check
  const step3Start = Date.now();
  const step3Response = http.get(`${BASE_URL}/api/v1/auth/verification-status?email=${encodeURIComponent(email)}`);
  const step3Duration = Date.now() - step3Start;
  
  const totalDuration = step1Duration + step2Duration + step3Duration;
  responseTime.add(totalDuration);
  throughput.add(1);
  
  const success = check({}, {
    'verification flow step 1 < 500ms': () => step1Duration < 500,
    'verification flow step 2 < 300ms': () => step2Duration < 300,
    'verification flow step 3 < 100ms': () => step3Duration < 100,
    'total verification flow < 1s': () => totalDuration < 1000,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testDatabaseOperations() {
  const operations = [
    {
      name: 'colleges-list',
      url: `${BASE_URL}/api/v1/colleges`,
      method: 'GET',
      expectedTime: 200,
    },
    {
      name: 'college-verification',
      url: `${BASE_URL}/api/v1/auth/verify-college-credentials`,
      method: 'POST',
      body: JSON.stringify({
        college_id: 'test-college',
        student_name: 'Test Student',
        branch: 'CS',
        year: 2024,
        verification_password: 'testpass'
      }),
      expectedTime: 800,
    },
    {
      name: 'domain-request',
      url: `${BASE_URL}/api/v1/domains/request`,
      method: 'POST',
      body: JSON.stringify({
        college_name: 'Test College',
        domain: 'test.edu',
        contact_email: `test${Date.now()}@example.com`
      }),
      expectedTime: 300,
    },
  ];
  
  operations.forEach(op => {
    const start = Date.now();
    const response = http.request(op.method, op.url, op.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    });
    
    const duration = Date.now() - start;
    responseTime.add(duration);
    throughput.add(1);
    
    const success = check(response, {
      [`${op.name} responds`]: (r) => r.status >= 200 && r.status < 500,
      [`${op.name} response time < ${op.expectedTime}ms`]: () => duration < op.expectedTime,
    });
    
    if (!success) {
      errorRate.add(1);
    }
  });
}

function testFileOperations() {
  // Test file upload endpoints (if they exist)
  const fileEndpoints = [
    {
      name: 'health-check',
      url: `${BASE_URL}/api/health`,
      method: 'GET',
      expectedTime: 50,
    },
  ];
  
  fileEndpoints.forEach(endpoint => {
    const start = Date.now();
    const response = http.request(endpoint.method, endpoint.url, null, {
      timeout: '5s',
    });
    
    const duration = Date.now() - start;
    responseTime.add(duration);
    throughput.add(1);
    
    const success = check(response, {
      [`${endpoint.name} responds quickly`]: () => duration < endpoint.expectedTime,
    });
    
    if (!success) {
      errorRate.add(1);
    }
  });
}

function testAllEndpoints() {
  const testFunctions = [
    testAuthEndpoints,
    testVerificationFlow,
    testDatabaseOperations,
    testFileOperations,
  ];
  
  // Run a random test function
  const randomTest = testFunctions[Math.floor(Math.random() * testFunctions.length)];
  randomTest();
}