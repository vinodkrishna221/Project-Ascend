// Stress Testing for System Reliability Under Peak Load
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Stress testing metrics
const systemReliability = new Rate('system_reliability');
const errorRecoveryTime = new Trend('error_recovery_time');
const resourceUtilization = new Gauge('resource_utilization');
const failureCount = new Counter('failure_count');
const recoveryCount = new Counter('recovery_count');

export const options = {
  scenarios: {
    // Extreme load stress test
    extreme_load_stress: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      stages: [
        { duration: '2m', target: 50 },    // Baseline
        { duration: '2m', target: 200 },   // High load
        { duration: '2m', target: 500 },   // Very high load
        { duration: '3m', target: 1000 },  // Extreme load
        { duration: '2m', target: 1500 },  // Breaking point
        { duration: '3m', target: 1500 },  // Sustained breaking point
        { duration: '2m', target: 500 },   // Recovery
        { duration: '2m', target: 100 },   // Cool down
        { duration: '2m', target: 0 },     // End
      ],
      preAllocatedVUs: 200,
      maxVUs: 2000,
    },
    
    // Spike stress test
    spike_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   // Normal load
        { duration: '10s', target: 1000 }, // Sudden spike
        { duration: '2m', target: 1000 },  // Sustained spike
        { duration: '10s', target: 100 },  // Sudden drop
        { duration: '1m', target: 100 },   // Recovery
        { duration: '10s', target: 1500 }, // Bigger spike
        { duration: '1m', target: 1500 },  // Sustained bigger spike
        { duration: '10s', target: 0 },    // Complete drop
      ],
    },
    
    // Resource exhaustion test
    resource_exhaustion: {
      executor: 'constant-arrival-rate',
      rate: 800, // Very high constant rate
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 300,
      maxVUs: 1000,
    },
  },
  
  thresholds: {
    // Stress test thresholds (more lenient than normal operation)
    system_reliability: ['rate>0.80'],         // 80% reliability under stress
    http_req_failed: ['rate<0.20'],           // Less than 20% failures
    http_req_duration: ['p(95)<10000'],       // 95% under 10s (degraded performance expected)
    error_recovery_time: ['p(90)<5000'],      // 90% of errors recover within 5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const stressType = __ENV.STRESS_TYPE || 'mixed_stress';
  
  switch (stressType) {
    case 'auth_stress':
      testAuthenticationStress();
      break;
    case 'database_stress':
      testDatabaseStress();
      break;
    case 'concurrent_stress':
      testConcurrentOperationsStress();
      break;
    case 'memory_stress':
      testMemoryStress();
      break;
    default:
      testMixedStress();
  }
  
  // Minimal sleep to maximize stress
  sleep(Math.random() * 0.1);
}

function testAuthenticationStress() {
  const userId = `stress_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const email = `${userId}@stresstest.edu`;
  
  const operations = [
    // Email verification stress
    () => {
      const start = Date.now();
      const response = http.post(`${BASE_URL}/api/v1/auth/verify-email`,
        JSON.stringify({
          email: email,
          role: Math.random() > 0.5 ? 'student' : 'aspirant'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '30s',
        }
      );
      
      const duration = Date.now() - start;
      resourceUtilization.add(duration);
      
      return checkStressResponse(response, 'email-verification', duration);
    },
    
    // Code verification stress
    () => {
      const start = Date.now();
      const response = http.post(`${BASE_URL}/api/v1/auth/verify-code`,
        JSON.stringify({
          email: email,
          code: Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '30s',
        }
      );
      
      const duration = Date.now() - start;
      resourceUtilization.add(duration);
      
      return checkStressResponse(response, 'code-verification', duration);
    },
    
    // Token refresh stress
    () => {
      const start = Date.now();
      const response = http.post(`${BASE_URL}/api/v1/auth/refresh-token`,
        JSON.stringify({
          refresh_token: `stress_token_${Math.random()}`
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '30s',
        }
      );
      
      const duration = Date.now() - start;
      resourceUtilization.add(duration);
      
      return checkStressResponse(response, 'token-refresh', duration);
    },
  ];
  
  // Execute random operation
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const success = operation();
  
  systemReliability.add(success ? 1 : 0);
}

function testDatabaseStress() {
  const operations = [
    // College database verification stress
    () => {
      const start = Date.now();
      const response = http.post(`${BASE_URL}/api/v1/auth/verify-college-credentials`,
        JSON.stringify({
          college_id: `stress-college-${Math.floor(Math.random() * 100)}`,
          student_name: `Stress Student ${Math.floor(Math.random() * 10000)}`,
          branch: ['CS', 'EE', 'ME', 'CE', 'IT'][Math.floor(Math.random() * 5)],
          year: 2020 + Math.floor(Math.random() * 5),
          verification_password: `stress${Math.floor(Math.random() * 100000)}`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '45s',
        }
      );
      
      const duration = Date.now() - start;
      resourceUtilization.add(duration);
      
      return checkStressResponse(response, 'college-verification', duration);
    },
    
    // Colleges list stress
    () => {
      const start = Date.now();
      const response = http.get(`${BASE_URL}/api/v1/colleges?limit=${Math.floor(Math.random() * 100) + 1}`, {
        timeout: '20s',
      });
      
      const duration = Date.now() - start;
      resourceUtilization.add(duration);
      
      return checkStressResponse(response, 'colleges-list', duration);
    },
    
    // Domain request stress
    () => {
      const start = Date.now();
      const response = http.post(`${BASE_URL}/api/v1/domains/request`,
        JSON.stringify({
          college_name: `Stress College ${Math.floor(Math.random() * 1000)}`,
          domain: `stress${Math.floor(Math.random() * 10000)}.edu`,
          contact_email: `stress${Math.floor(Math.random() * 10000)}@example.com`,
          verification_type: Math.random() > 0.5 ? 'email' : 'database',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '30s',
        }
      );
      
      const duration = Date.now() - start;
      resourceUtilization.add(duration);
      
      return checkStressResponse(response, 'domain-request', duration);
    },
  ];
  
  // Execute random database operation
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const success = operation();
  
  systemReliability.add(success ? 1 : 0);
}

function testConcurrentOperationsStress() {
  const userId = `concurrent_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const email = `${userId}@concurrenttest.edu`;
  
  // Execute multiple operations simultaneously
  const requests = [
    {
      method: 'POST',
      url: `${BASE_URL}/api/v1/auth/verify-email`,
      body: JSON.stringify({ email: email, role: 'student' }),
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/v1/colleges`,
    },
    {
      method: 'POST',
      url: `${BASE_URL}/api/v1/domains/request`,
      body: JSON.stringify({
        college_name: `Concurrent College ${Math.floor(Math.random() * 1000)}`,
        domain: `concurrent${Math.floor(Math.random() * 1000)}.edu`,
        contact_email: email,
      }),
    },
    {
      method: 'POST',
      url: `${BASE_URL}/api/v1/auth/verify-college-credentials`,
      body: JSON.stringify({
        college_id: 'concurrent-college',
        student_name: `Concurrent Student ${Math.floor(Math.random() * 1000)}`,
        branch: 'CS',
        year: 2024,
        verification_password: `concurrent${Math.floor(Math.random() * 1000)}`,
      }),
    },
  ];
  
  const start = Date.now();
  const responses = http.batch(requests.map(req => ({
    ...req,
    params: {
      headers: { 'Content-Type': 'application/json' },
      timeout: '45s',
    },
  })));
  
  const duration = Date.now() - start;
  resourceUtilization.add(duration);
  
  let successCount = 0;
  responses.forEach((response, index) => {
    const success = checkStressResponse(response, `concurrent-op-${index}`, response.timings.duration);
    if (success) successCount++;
  });
  
  const overallSuccess = successCount >= responses.length * 0.7; // 70% success rate for concurrent ops
  systemReliability.add(overallSuccess ? 1 : 0);
}

function testMemoryStress() {
  // Create large payloads to stress memory
  const largeData = {
    email: `memory_stress_${Date.now()}_${Math.floor(Math.random() * 100000)}@memorytest.edu`,
    role: 'student',
    metadata: {
      // Large metadata object to stress memory
      data: Array(1000).fill(0).map((_, i) => ({
        id: i,
        value: `stress_data_${i}_${Math.random()}`,
        timestamp: Date.now(),
        nested: {
          level1: Array(10).fill(0).map(j => `nested_${j}_${Math.random()}`),
          level2: {
            deep: Array(5).fill(0).map(k => `deep_${k}_${Math.random()}`),
          },
        },
      })),
    },
  };
  
  const start = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/auth/verify-email`,
    JSON.stringify(largeData),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '60s',
    }
  );
  
  const duration = Date.now() - start;
  resourceUtilization.add(duration);
  
  const success = checkStressResponse(response, 'memory-stress', duration);
  systemReliability.add(success ? 1 : 0);
}

function testMixedStress() {
  const stressTests = [
    testAuthenticationStress,
    testDatabaseStress,
    testConcurrentOperationsStress,
    testMemoryStress,
  ];
  
  // Randomly execute stress tests
  const randomTest = stressTests[Math.floor(Math.random() * stressTests.length)];
  randomTest();
}

function checkStressResponse(response, operationType, duration) {
  const isSuccess = response.status >= 200 && response.status < 500;
  const isReasonableTime = duration < 30000; // 30 seconds max under stress
  const hasBody = response.body && response.body.length > 0;
  
  const success = check(response, {
    [`${operationType} stress response ok`]: () => isSuccess,
    [`${operationType} stress time reasonable`]: () => isReasonableTime,
    [`${operationType} stress has response body`]: () => hasBody,
  });
  
  if (!success) {
    failureCount.add(1);
    
    // Test error recovery
    const recoveryStart = Date.now();
    sleep(0.1); // Brief pause
    
    // Retry the same operation to test recovery
    const retryResponse = http.get(`${BASE_URL}/api/v1/colleges`, { timeout: '10s' });
    const recoveryTime = Date.now() - recoveryStart;
    
    if (retryResponse.status === 200) {
      recoveryCount.add(1);
      errorRecoveryTime.add(recoveryTime);
    }
  }
  
  return success;
}

// Setup and teardown for stress testing
export function setup() {
  console.log('Starting stress test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Stress type: ${__ENV.STRESS_TYPE || 'mixed_stress'}`);
  
  // System health check before stress test
  const healthResponse = http.get(`${BASE_URL}/api/v1/colleges`);
  if (healthResponse.status !== 200) {
    console.error('System not healthy before stress test');
    return { healthy: false };
  }
  
  return { 
    healthy: true, 
    startTime: Date.now(),
    initialResponse: healthResponse.timings.duration 
  };
}

export function teardown(data) {
  if (!data.healthy) {
    console.log('Stress test skipped due to unhealthy system');
    return;
  }
  
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Stress test completed in ${duration} seconds`);
  
  // Post-stress health check
  const postStressResponse = http.get(`${BASE_URL}/api/v1/colleges`);
  const recoveryTime = postStressResponse.timings.duration;
  
  console.log(`Initial response time: ${data.initialResponse}ms`);
  console.log(`Post-stress response time: ${recoveryTime}ms`);
  
  if (recoveryTime > data.initialResponse * 2) {
    console.warn('System may not have fully recovered from stress test');
  } else {
    console.log('System appears to have recovered well from stress test');
  }
}