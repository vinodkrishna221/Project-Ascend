# Authentication Flow Performance and Load Testing

This directory contains comprehensive performance and load testing scripts for the Ascend authentication flow system. The tests are built using [K6](https://k6.io/), a modern load testing tool designed for developer-centric performance testing.

## 🎯 Test Coverage

### 1. Performance Benchmarks (`performance-benchmarks.js`)
- **Response Time Validation**: Ensures API endpoints meet performance benchmarks
- **Throughput Testing**: Validates system capacity under normal load
- **Endpoint-Specific Testing**: Individual performance testing for each auth endpoint
- **Benchmarks**:
  - Email verification: < 500ms
  - Code verification: < 300ms
  - Token refresh: < 200ms
  - Status checks: < 100ms

### 2. Load Testing (`auth-load-test.js`)
- **Concurrent Verification Scenarios**: Multiple users verifying simultaneously
- **Mixed Authentication Flows**: Email and college database verification
- **Session Management Testing**: Token refresh and session handling
- **Real-world Simulation**: Realistic user behavior patterns

### 3. Scalability Testing (`scalability-test.js`)
- **High-Volume Signup Periods**: Simulates college admission result days
- **Peak Load Simulation**: 500+ signups per second
- **Sustained High Load**: Extended periods of high traffic
- **Burst Traffic**: Sudden spikes in user activity

### 4. Stress Testing (`stress-test.js`)
- **System Breaking Point**: Finds maximum system capacity
- **Resource Exhaustion**: Tests system behavior under extreme load
- **Error Recovery**: Validates system recovery after failures
- **Reliability Under Stress**: Ensures graceful degradation

## 🚀 Quick Start

### Prerequisites

1. **Install K6**:
   ```bash
   # macOS
   brew install k6
   
   # Windows
   choco install k6
   
   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Ensure Server is Running**:
   ```bash
   cd web
   npm run dev
   # Server should be running at http://localhost:3000
   ```

### Running Tests

#### Quick Performance Test (2-3 minutes)
```bash
cd web/scripts/load-testing
npm run test:quick
```

#### Individual Test Suites
```bash
# Performance benchmarks
npm run test:performance

# Load testing
npm run test:load

# Scalability testing
npm run test:scalability

# Stress testing
npm run test:stress
```

#### Complete Test Suite
```bash
npm run test:all
```

#### Using the Shell Script (Linux/macOS)
```bash
# Make executable
chmod +x run-performance-tests.sh

# Run all tests
./run-performance-tests.sh

# Run specific test type
./run-performance-tests.sh quick
./run-performance-tests.sh performance
./run-performance-tests.sh load
./run-performance-tests.sh scalability
./run-performance-tests.sh stress
```

## 📊 Test Scenarios

### Email Verification Load Test
```javascript
// Simulates concurrent email verification
- 50-100 concurrent users
- Email verification initiation
- Code verification with mock codes
- Response time validation
- Error rate monitoring
```

### College Database Verification Test
```javascript
// Tests college database verification under load
- Multiple college credentials
- Database query performance
- Connection pooling efficiency
- Concurrent database operations
```

### Peak Signup Period Simulation
```javascript
// Simulates college admission result days
- 0 → 500 signups/second ramp-up
- Sustained peak load
- Mixed verification methods
- System stability monitoring
```

### Stress Test Scenarios
```javascript
// Pushes system beyond normal capacity
- 1000+ concurrent users
- Resource exhaustion testing
- Error recovery validation
- System reliability assessment
```

## 🎯 Performance Benchmarks

### Response Time Targets
| Endpoint | Target | Acceptable |
|----------|--------|------------|
| Email Verification | < 500ms | < 1s |
| Code Verification | < 300ms | < 800ms |
| Token Refresh | < 200ms | < 500ms |
| Status Check | < 100ms | < 300ms |
| College Verification | < 800ms | < 2s |

### Throughput Targets
| Scenario | Target | Peak |
|----------|--------|------|
| Normal Load | 50 req/s | 100 req/s |
| Peak Signup | 200 req/s | 500 req/s |
| Stress Test | 500 req/s | 1000+ req/s |

### Reliability Targets
- **Success Rate**: > 95% under normal load
- **Error Rate**: < 5% under normal load
- **Stress Reliability**: > 80% under extreme load
- **Recovery Time**: < 5 seconds after failures

## 📈 Metrics and Monitoring

### Key Performance Indicators (KPIs)
- **Response Time Percentiles**: P50, P90, P95, P99
- **Error Rates**: HTTP errors, timeouts, failures
- **Throughput**: Requests per second
- **Concurrent Users**: Active user simulation
- **System Resource Utilization**: Memory, CPU, connections

### Custom Metrics
```javascript
// Authentication-specific metrics
- auth_response_time: Authentication endpoint response times
- verification_attempts: Total verification attempts
- concurrent_users: Concurrent user count
- signup_success_rate: Successful signup completion rate
- error_recovery_time: Time to recover from errors
```

## 🔧 Configuration

### Environment Variables
```bash
BASE_URL=http://localhost:3000    # Target server URL
SCENARIO=mixed                    # Test scenario type
TEST_TYPE=all                     # Specific test type
STRESS_TYPE=mixed_stress          # Stress test variant
SCALABILITY_SCENARIO=full_signup_flow  # Scalability test type
```

### Test Options
```javascript
export const options = {
  scenarios: {
    // Define test scenarios
  },
  thresholds: {
    // Performance thresholds
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};
```

## 📋 Test Results

### Result Files
- **JSON Results**: Detailed metrics in JSON format
- **Summary Reports**: Human-readable test summaries
- **Performance Report**: Comprehensive markdown report
- **Timestamps**: All results timestamped for tracking

### Sample Output
```
✅ performance_benchmarks completed successfully
📈 Key Metrics for performance_benchmarks:
  http_req_duration..........: avg=245ms min=89ms med=198ms max=1.2s p(90)=456ms p(95)=678ms
  http_req_failed............: 2.34% ✓ 156 ✗ 4
  checks.....................: 98.67% ✓ 1234 ✗ 16
```

## 🚨 Troubleshooting

### Common Issues

1. **K6 Not Installed**
   ```bash
   # Install K6 first
   brew install k6  # macOS
   choco install k6  # Windows
   ```

2. **Server Not Running**
   ```bash
   # Start the development server
   cd web && npm run dev
   ```

3. **High Error Rates**
   - Check server logs for errors
   - Verify database connections
   - Monitor system resources
   - Reduce test load if necessary

4. **Slow Response Times**
   - Check database performance
   - Monitor network latency
   - Verify server resources
   - Consider caching optimizations

### Performance Optimization Tips

1. **Database Optimization**
   - Add appropriate indexes
   - Optimize query performance
   - Use connection pooling
   - Monitor slow queries

2. **Caching Strategy**
   - Cache frequently accessed data
   - Use Redis for session storage
   - Implement API response caching
   - Cache college domain lists

3. **Server Configuration**
   - Optimize Node.js settings
   - Configure proper timeouts
   - Use clustering for CPU utilization
   - Monitor memory usage

## 📚 Additional Resources

- [K6 Documentation](https://k6.io/docs/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/performance-testing/)
- [Load Testing Guidelines](https://k6.io/docs/testing-guides/load-testing/)
- [Stress Testing Methodology](https://k6.io/docs/testing-guides/stress-testing/)

## 🤝 Contributing

When adding new performance tests:

1. Follow existing naming conventions
2. Include proper error handling
3. Add meaningful metrics
4. Document test scenarios
5. Update this README
6. Test locally before committing

## 📄 License

This performance testing suite is part of the Ascend project and follows the same license terms.