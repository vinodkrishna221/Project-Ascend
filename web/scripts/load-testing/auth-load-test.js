// Authentication Flow Load Testing
import { check, sleep } from 'k6';
import http from 'k6/http';
import { 
  options, 
  errorRate, 
  authResponseTime, 
  verificationAttempts,
  concurrentUsers,
  generateTestUser,
  generateCollegeCredentials,
  BASE_URL 
} from './k6-config.js';

export { options };

// Test scenarios
export default function () {
  const scenario = __ENV.SCENARIO || 'mixed';
  
  switch (scenario) {
    case 'email_verification':
      testEmailVerification();
      break;
    case 'college_database':
      testCollegeDatabaseVerification();
      break;
    case 'session_management':
      testSessionManagement();
      break;
    case 'concurrent_signup':
      testConcurrentSignup();
      break;
    default:
      testMixedScenario();
  }
  
  sleep(1);
}

function testEmailVerification() {
  const user = generateTestUser();
  concurrentUsers.add(1);
  
  // Step 1: Initiate email verification
  const verifyEmailStart = Date.now();
  const verifyEmailResponse = http.post(`${BASE_URL}/api/v1/auth/verify-email`, 
    JSON.stringify({
      email: user.email,
      role: 'student'
    }), 
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );
  
  const verifyEmailDuration = Date.now() - verifyEmailStart;
  authResponseTime.add(verifyEmailDuration);
  verificationAttempts.add(1);
  
  const verifyEmailSuccess = check(verifyEmailResponse, {
    'email verification initiated': (r) => r.status === 200,
    'email verification response time < 2s': (r) => r.timings.duration < 2000,
    'email verification has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!verifyEmailSuccess) {
    errorRate.add(1);
    console.error(`Email verification failed: ${verifyEmailResponse.status} - ${verifyEmailResponse.body}`);
    return;
  }
  
  // Step 2: Simulate code verification (with mock code)
  sleep(1); // Simulate user receiving and entering code
  
  const verifyCodeStart = Date.now();
  const verifyCodeResponse = http.post(`${BASE_URL}/api/v1/auth/verify-code`,
    JSON.stringify({
      email: user.email,
      code: '123456' // Mock verification code
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );
  
  const verifyCodeDuration = Date.now() - verifyCodeStart;
  authResponseTime.add(verifyCodeDuration);
  
  const verifyCodeSuccess = check(verifyCodeResponse, {
    'code verification completed': (r) => r.status === 200 || r.status === 400, // 400 expected for mock code
    'code verification response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  if (!verifyCodeSuccess) {
    errorRate.add(1);
  }
}

function testCollegeDatabaseVerification() {
  const credentials = generateCollegeCredentials();
  concurrentUsers.add(1);
  
  const verifyStart = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/auth/verify-college-credentials`,
    JSON.stringify(credentials),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );
  
  const duration = Date.now() - verifyStart;
  authResponseTime.add(duration);
  verificationAttempts.add(1);
  
  const success = check(response, {
    'college verification attempted': (r) => r.status === 200 || r.status === 400 || r.status === 404,
    'college verification response time < 1s': (r) => r.timings.duration < 1000,
    'college verification has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.success === 'boolean';
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testSessionManagement() {
  const user = generateTestUser();
  concurrentUsers.add(1);
  
  // Mock login to get session token
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );
  
  // Test session refresh (even if login fails, test the endpoint)
  const refreshStart = Date.now();
  const refreshResponse = http.post(`${BASE_URL}/api/v1/auth/refresh-token`,
    JSON.stringify({
      refresh_token: 'mock-refresh-token'
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );
  
  const refreshDuration = Date.now() - refreshStart;
  authResponseTime.add(refreshDuration);
  
  const success = check(refreshResponse, {
    'refresh token endpoint responds': (r) => r.status >= 200 && r.status < 500,
    'refresh token response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testConcurrentSignup() {
  const user = generateTestUser();
  concurrentUsers.add(1);
  
  // Test multiple concurrent operations
  const requests = [
    {
      method: 'POST',
      url: `${BASE_URL}/api/v1/auth/verify-email`,
      body: JSON.stringify({ email: user.email, role: 'student' }),
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/v1/colleges`,
    },
    {
      method: 'POST',
      url: `${BASE_URL}/api/v1/domains/request`,
      body: JSON.stringify({
        college_name: 'Test College',
        domain: 'test.edu',
        contact_email: user.email,
      }),
    },
  ];
  
  const responses = http.batch(requests.map(req => ({
    ...req,
    params: {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    },
  })));
  
  responses.forEach((response, index) => {
    const success = check(response, {
      [`concurrent request ${index} succeeds`]: (r) => r.status >= 200 && r.status < 500,
      [`concurrent request ${index} response time < 2s`]: (r) => r.timings.duration < 2000,
    });
    
    if (!success) {
      errorRate.add(1);
    }
  });
}

function testMixedScenario() {
  const scenarios = [
    testEmailVerification,
    testCollegeDatabaseVerification,
    testSessionManagement,
    testConcurrentSignup,
  ];
  
  // Randomly select a scenario to simulate mixed load
  const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  randomScenario();
}