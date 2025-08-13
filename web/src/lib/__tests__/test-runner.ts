/**
 * Comprehensive Test Runner for Authentication System
 * Orchestrates all test types and generates coverage reports
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  pattern: string;
  description: string;
  timeout?: number;
}

interface TestResults {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  coverage?: number;
  duration: number;
  errors: string[];
}

class AuthTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      pattern: '**/*.test.ts',
      description: 'Unit tests for individual services and utilities',
      timeout: 30000,
    },
    {
      name: 'Integration Tests',
      pattern: '**/*.integration.test.ts',
      description: 'Integration tests for complete authentication flows',
      timeout: 60000,
    },
    {
      name: 'End-to-End Tests',
      pattern: '**/*.e2e.test.ts',
      description: 'End-to-end tests for user journey validation',
      timeout: 120000,
    },
    {
      name: 'Security Tests',
      pattern: '**/*.security.test.ts',
      description: 'Security tests for vulnerability assessment',
      timeout: 90000,
    },
  ];

  private results: TestResults[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Authentication Test Suite\n');

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.generateReport();
    this.checkCoverageThresholds();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📋 Running ${suite.name}...`);
    console.log(`   ${suite.description}\n`);

    const startTime = Date.now();
    let result: TestResults = {
      suite: suite.name,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: [],
    };

    try {
      const command = [
        'npx jest',
        `--testPathPattern="${suite.pattern}"`,
        '--verbose',
        '--coverage',
        '--coverageReporters=json-summary',
        '--coverageReporters=text',
        `--testTimeout=${suite.timeout || 30000}`,
        '--detectOpenHandles',
        '--forceExit',
      ].join(' ');

      const output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Parse Jest output
      result = this.parseJestOutput(output, suite.name);
      
    } catch (error: any) {
      console.error(`❌ ${suite.name} failed:`, error.message);
      result.failed = 1;
      result.errors.push(error.message);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);

    this.printSuiteResults(result);
  }

  private parseJestOutput(output: string, suiteName: string): TestResults {
    const result: TestResults = {
      suite: suiteName,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: [],
    };

    // Parse test results
    const testResultMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (testResultMatch) {
      result.failed = parseInt(testResultMatch[1]);
      result.passed = parseInt(testResultMatch[2]);
    } else {
      const passedMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (passedMatch) {
        result.passed = parseInt(passedMatch[1]);
      }
    }

    // Parse coverage
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      result.coverage = parseFloat(coverageMatch[1]);
    }

    // Extract errors
    const errorMatches = output.match(/FAIL\s+.*?\n(.*?)(?=\n\s*PASS|\n\s*Test Suites:|$)/gs);
    if (errorMatches) {
      result.errors = errorMatches.map(match => match.trim());
    }

    return result;
  }

  private printSuiteResults(result: TestResults): void {
    const status = result.failed === 0 ? '✅' : '❌';
    const coverage = result.coverage ? ` (${result.coverage}% coverage)` : '';
    
    console.log(`${status} ${result.suite}: ${result.passed} passed, ${result.failed} failed${coverage}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s\n`);

    if (result.errors.length > 0) {
      console.log('   Errors:');
      result.errors.forEach(error => {
        console.log(`   - ${error.substring(0, 100)}...`);
      });
      console.log('');
    }
  }

  private generateReport(): void {
    console.log('📊 Test Suite Summary\n');
    console.log('=' .repeat(60));

    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const avgCoverage = this.results
      .filter(r => r.coverage !== undefined)
      .reduce((sum, r) => sum + (r.coverage || 0), 0) / 
      this.results.filter(r => r.coverage !== undefined).length;

    console.log(`Total Tests: ${totalPassed + totalFailed}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log(`Average Coverage: ${avgCoverage.toFixed(1)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('=' .repeat(60));

    // Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: totalPassed + totalFailed,
        passed: totalPassed,
        failed: totalFailed,
        successRate: (totalPassed / (totalPassed + totalFailed)) * 100,
        averageCoverage: avgCoverage,
        totalDuration: totalDuration,
      },
      suites: this.results,
    };

    writeFileSync(
      join(process.cwd(), 'test-results.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📄 Detailed report saved to test-results.json');
  }

  private checkCoverageThresholds(): void {
    console.log('\n🎯 Coverage Threshold Check\n');

    const thresholds = {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    };

    const avgCoverage = this.results
      .filter(r => r.coverage !== undefined)
      .reduce((sum, r) => sum + (r.coverage || 0), 0) / 
      this.results.filter(r => r.coverage !== undefined).length;

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const status = avgCoverage >= threshold ? '✅' : '❌';
      console.log(`${status} ${metric}: ${avgCoverage.toFixed(1)}% (threshold: ${threshold}%)`);
    });

    if (avgCoverage < Math.min(...Object.values(thresholds))) {
      console.log('\n⚠️  Coverage below minimum thresholds. Consider adding more tests.');
      process.exit(1);
    } else {
      console.log('\n🎉 All coverage thresholds met!');
    }
  }

  async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => 
      s.name.toLowerCase().includes(suiteName.toLowerCase())
    );

    if (!suite) {
      console.error(`❌ Test suite "${suiteName}" not found.`);
      console.log('Available suites:');
      this.testSuites.forEach(s => console.log(`  - ${s.name}`));
      return;
    }

    await this.runTestSuite(suite);
    this.printSuiteResults(this.results[0]);
  }

  async runWithWatch(): Promise<void> {
    console.log('👀 Running tests in watch mode...\n');

    const command = [
      'npx jest',
      '--watch',
      '--verbose',
      '--coverage',
      '--coverageReporters=text',
    ].join(' ');

    execSync(command, {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  }
}

// CLI interface
const args = process.argv.slice(2);
const runner = new AuthTestRunner();

async function main() {
  try {
    if (args.includes('--watch')) {
      await runner.runWithWatch();
    } else if (args.includes('--suite')) {
      const suiteIndex = args.indexOf('--suite');
      const suiteName = args[suiteIndex + 1];
      if (!suiteName) {
        console.error('❌ Please specify a suite name after --suite');
        process.exit(1);
      }
      await runner.runSpecificSuite(suiteName);
    } else {
      await runner.runAllTests();
    }
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AuthTestRunner };