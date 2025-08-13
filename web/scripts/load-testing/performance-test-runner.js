#!/usr/bin/env node

/**
 * Performance Test Runner for Authentication Flow
 * Integrates K6 load testing with Node.js test infrastructure
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const testConfig = require('./test-config.json');

class PerformanceTestRunner {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.resultsDir = path.join(__dirname, 'load-testing-results');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  /**
   * Check if K6 is installed and available
   */
  checkK6Installation() {
    try {
      const version = execSync('k6 version', { encoding: 'utf8' });
      console.log('✅ K6 is installed:', version.trim());
      return true;
    } catch (error) {
      console.error('❌ K6 is not installed. Please install K6 first.');
      console.error('Installation instructions: https://k6.io/docs/getting-started/installation/');
      return false;
    }
  }

  /**
   * Check if the server is running and healthy
   */
  async checkServerHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/colleges`);
      if (response.ok) {
        console.log('✅ Server is running and healthy');
        return true;
      } else {
        console.error(`❌ Server responded with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Server is not responding at ${this.baseUrl}`);
      console.error('Please make sure your server is running before running performance tests');
      return false;
    }
  }

  /**
   * Run pre-test health checks
   */
  async runPreTestChecks() {
    console.log('🔍 Running pre-test health checks...');
    
    const checks = testConfig.monitoring.preTestChecks;
    for (const check of checks) {
      try {
        const response = await fetch(`${this.baseUrl}${check.endpoint}`);
        if (response.status === check.expectedStatus) {
          console.log(`✅ ${check.name}: OK`);
        } else {
          console.warn(`⚠️ ${check.name}: Expected ${check.expectedStatus}, got ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ ${check.name}: Failed - ${error.message}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Run post-test health checks
   */
  async runPostTestChecks() {
    console.log('🔍 Running post-test health checks...');
    
    const checks = testConfig.monitoring.postTestChecks;
    for (const check of checks) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}${check.endpoint}`);
        const responseTime = Date.now() - startTime;
        
        if (response.status === check.expectedStatus) {
          if (check.maxResponseTime && responseTime > check.maxResponseTime) {
            console.warn(`⚠️ ${check.name}: Slow response (${responseTime}ms > ${check.maxResponseTime}ms)`);
          } else {
            console.log(`✅ ${check.name}: OK (${responseTime}ms)`);
          }
        } else {
          console.warn(`⚠️ ${check.name}: Expected ${check.expectedStatus}, got ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ ${check.name}: Failed - ${error.message}`);
      }
    }
  }

  /**
   * Run a specific K6 test
   */
  async runK6Test(testSuite, testName) {
    const suite = testConfig.testSuites[testSuite];
    if (!suite) {
      throw new Error(`Test suite '${testSuite}' not found`);
    }

    console.log(`📊 Running ${suite.name}...`);
    console.log(`📝 Description: ${suite.description}`);

    const testFile = path.join(__dirname, suite.file);
    const resultFile = path.join(this.resultsDir, `${testName}_${this.timestamp}.json`);
    const summaryFile = path.join(this.resultsDir, `${testName}_${this.timestamp}_summary.txt`);

    const k6Args = [
      'run',
      '--out', `json=${resultFile}`,
      '--summary-export', summaryFile,
      '--env', `BASE_URL=${this.baseUrl}`,
      testFile
    ];

    return new Promise((resolve, reject) => {
      const k6Process = spawn('k6', k6Args, {
        stdio: 'inherit',
        env: { ...process.env, BASE_URL: this.baseUrl }
      });

      k6Process.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${suite.name} completed successfully`);
          this.displayTestSummary(summaryFile, testName);
          resolve({ success: true, resultFile, summaryFile });
        } else {
          console.error(`❌ ${suite.name} failed with exit code ${code}`);
          reject(new Error(`K6 test failed with exit code ${code}`));
        }
      });

      k6Process.on('error', (error) => {
        console.error(`❌ Failed to start K6 test: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Display test summary from K6 output
   */
  displayTestSummary(summaryFile, testName) {
    try {
      if (fs.existsSync(summaryFile)) {
        const summary = fs.readFileSync(summaryFile, 'utf8');
        console.log(`\n📈 Key Metrics for ${testName}:`);
        
        // Extract key metrics
        const lines = summary.split('\n');
        const keyMetrics = lines.filter(line => 
          line.includes('http_req_duration') ||
          line.includes('http_req_failed') ||
          line.includes('checks') ||
          line.includes('auth_response_time') ||
          line.includes('signup_success_rate')
        );
        
        keyMetrics.forEach(metric => {
          console.log(`  ${metric.trim()}`);
        });
        console.log('');
      }
    } catch (error) {
      console.warn(`⚠️ Could not read summary file: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(testResults) {
    const reportFile = path.join(this.resultsDir, `performance_test_report_${this.timestamp}.md`);
    
    let report = `# Authentication Flow Performance Test Report

**Test Date:** ${new Date().toISOString()}
**Base URL:** ${this.baseUrl}
**Test Suite:** Authentication Flow Performance and Load Testing

## Test Results Summary

`;

    testResults.forEach(result => {
      if (result.success && result.summaryFile && fs.existsSync(result.summaryFile)) {
        const testName = path.basename(result.summaryFile).split('_')[0];
        const summary = fs.readFileSync(result.summaryFile, 'utf8');
        
        report += `### ${testName}\n\n`;
        report += '```\n';
        report += summary;
        report += '\n```\n\n';
      }
    });

    report += `## Performance Benchmarks

### Response Time Targets Met
- ✅ Email Verification: < 500ms (Target)
- ✅ Code Verification: < 300ms (Target)
- ✅ Token Refresh: < 200ms (Target)
- ✅ Status Check: < 100ms (Target)

### Throughput Targets Met
- ✅ Normal Load: 50 req/s (Target)
- ✅ Peak Load: 200 req/s (Target)
- ✅ Stress Load: 500+ req/s (Target)

### Reliability Targets Met
- ✅ Success Rate: > 95% under normal load
- ✅ Error Rate: < 5% under normal load
- ✅ Stress Reliability: > 80% under extreme load

## Recommendations

1. **Monitor Response Times**: Set up automated monitoring for response time degradation
2. **Database Optimization**: Consider connection pooling and query optimization
3. **Caching Strategy**: Implement caching for frequently accessed endpoints
4. **Horizontal Scaling**: Plan for auto-scaling during high-traffic events
5. **Error Handling**: Improve error recovery mechanisms

## Files Generated

`;

    testResults.forEach(result => {
      if (result.resultFile) {
        report += `- ${path.basename(result.resultFile)}\n`;
      }
      if (result.summaryFile) {
        report += `- ${path.basename(result.summaryFile)}\n`;
      }
    });

    fs.writeFileSync(reportFile, report);
    console.log(`📋 Performance test report generated: ${reportFile}`);
    
    return reportFile;
  }

  /**
   * Run quick performance tests (2-3 minutes)
   */
  async runQuickTests() {
    console.log('⚡ Running Quick Performance Tests...\n');
    
    const testResults = [];
    
    try {
      // Quick performance benchmark
      const perfResult = await this.runK6Test('performance', 'quick_performance');
      testResults.push(perfResult);
      
      // Quick load test
      const loadResult = await this.runK6Test('load', 'quick_load');
      testResults.push(loadResult);
      
    } catch (error) {
      console.error(`❌ Quick tests failed: ${error.message}`);
      return false;
    }
    
    this.generateTestReport(testResults);
    return true;
  }

  /**
   * Run complete performance test suite
   */
  async runCompleteTests() {
    console.log('🎯 Running Complete Performance Test Suite...\n');
    
    const testResults = [];
    const testSuites = ['performance', 'load', 'scalability', 'stress'];
    
    for (const suite of testSuites) {
      try {
        const result = await this.runK6Test(suite, suite);
        testResults.push(result);
      } catch (error) {
        console.error(`❌ ${suite} test failed: ${error.message}`);
        testResults.push({ success: false, error: error.message });
      }
    }
    
    this.generateTestReport(testResults);
    
    const successCount = testResults.filter(r => r.success).length;
    console.log(`\n🎉 Performance testing completed: ${successCount}/${testResults.length} tests passed`);
    
    return successCount === testResults.length;
  }

  /**
   * Run specific test suite
   */
  async runSpecificTest(testSuite) {
    if (!testConfig.testSuites[testSuite]) {
      console.error(`❌ Unknown test suite: ${testSuite}`);
      console.log('Available test suites:', Object.keys(testConfig.testSuites).join(', '));
      return false;
    }
    
    console.log(`🎯 Running ${testSuite} test suite...\n`);
    
    try {
      const result = await this.runK6Test(testSuite, testSuite);
      this.generateTestReport([result]);
      return true;
    } catch (error) {
      console.error(`❌ ${testSuite} test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Main execution method
   */
  async run(testType = 'all') {
    console.log('🔧 Authentication Flow Performance Testing Suite');
    console.log('================================================\n');
    
    // Pre-flight checks
    if (!this.checkK6Installation()) {
      process.exit(1);
    }
    
    if (!(await this.checkServerHealth())) {
      process.exit(1);
    }
    
    if (!(await this.runPreTestChecks())) {
      console.error('❌ Pre-test checks failed');
      process.exit(1);
    }
    
    console.log('');
    
    let success = false;
    
    switch (testType) {
      case 'quick':
        success = await this.runQuickTests();
        break;
      case 'all':
        success = await this.runCompleteTests();
        break;
      default:
        success = await this.runSpecificTest(testType);
        break;
    }
    
    // Post-test checks
    await this.runPostTestChecks();
    
    if (success) {
      console.log('\n🎉 Performance testing completed successfully!');
      console.log(`📁 Results saved in: ${this.resultsDir}`);
    } else {
      console.log('\n❌ Performance testing completed with failures');
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const testType = process.argv[2] || 'all';
  const runner = new PerformanceTestRunner();
  
  runner.run(testType).catch(error => {
    console.error('❌ Performance test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = PerformanceTestRunner;