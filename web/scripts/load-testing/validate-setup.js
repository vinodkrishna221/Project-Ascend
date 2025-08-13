#!/usr/bin/env node

/**
 * Performance Testing Setup Validation
 * Validates that all components are properly configured for performance testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.baseDir = __dirname;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warn') {
      this.warnings.push(message);
    }
  }

  /**
   * Check if required files exist
   */
  validateFiles() {
    console.log('\n🔍 Validating Performance Test Files...');
    
    const requiredFiles = [
      'k6-config.js',
      'auth-load-test.js',
      'performance-benchmarks.js',
      'scalability-test.js',
      'stress-test.js',
      'performance-test-runner.js',
      'test-config.json',
      'package.json',
      'README.md'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(this.baseDir, file);
      if (fs.existsSync(filePath)) {
        this.log(`${file} exists`);
      } else {
        this.log(`${file} is missing`, 'error');
      }
    });
  }

  /**
   * Validate test configuration
   */
  validateConfiguration() {
    console.log('\n🔧 Validating Test Configuration...');
    
    try {
      const configPath = path.join(this.baseDir, 'test-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Check test suites
      const requiredSuites = ['performance', 'load', 'scalability', 'stress'];
      requiredSuites.forEach(suite => {
        if (config.testSuites[suite]) {
          this.log(`Test suite '${suite}' configured`);
        } else {
          this.log(`Test suite '${suite}' missing from configuration`, 'error');
        }
      });
      
      // Check environments
      if (config.environments && config.environments.local) {
        this.log('Local environment configured');
      } else {
        this.log('Local environment not configured', 'warn');
      }
      
      // Check thresholds
      Object.keys(config.testSuites).forEach(suite => {
        if (config.testSuites[suite].thresholds) {
          this.log(`Thresholds configured for ${suite}`);
        } else {
          this.log(`No thresholds configured for ${suite}`, 'warn');
        }
      });
      
    } catch (error) {
      this.log(`Failed to validate configuration: ${error.message}`, 'error');
    }
  }

  /**
   * Check K6 installation
   */
  validateK6Installation() {
    console.log('\n🚀 Validating K6 Installation...');
    
    try {
      const version = execSync('k6 version', { encoding: 'utf8' });
      this.log(`K6 is installed: ${version.trim()}`);
      
      // Check if K6 can run a simple test
      const testScript = `
        import { check } from 'k6';
        export default function () {
          check(true, { 'k6 works': (val) => val === true });
        }
      `;
      
      const tempFile = path.join(this.baseDir, 'temp-test.js');
      fs.writeFileSync(tempFile, testScript);
      
      try {
        execSync(`k6 run --duration 1s --vus 1 ${tempFile}`, { stdio: 'pipe' });
        this.log('K6 can execute tests successfully');
        fs.unlinkSync(tempFile);
      } catch (error) {
        this.log('K6 test execution failed', 'error');
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
      
    } catch (error) {
      this.log('K6 is not installed or not in PATH', 'error');
      this.log('Install K6 from: https://k6.io/docs/getting-started/installation/', 'info');
    }
  }

  /**
   * Validate Node.js dependencies
   */
  validateNodeDependencies() {
    console.log('\n📦 Validating Node.js Dependencies...');
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 16) {
        this.log(`Node.js version ${nodeVersion} is supported`);
      } else {
        this.log(`Node.js version ${nodeVersion} is too old (requires >= 16)`, 'error');
      }
      
      // Check if we can import required modules
      const requiredModules = ['fs', 'path', 'child_process'];
      requiredModules.forEach(module => {
        try {
          require(module);
          this.log(`Module '${module}' available`);
        } catch (error) {
          this.log(`Module '${module}' not available`, 'error');
        }
      });
      
    } catch (error) {
      this.log(`Failed to validate Node.js dependencies: ${error.message}`, 'error');
    }
  }

  /**
   * Check server connectivity
   */
  async validateServerConnectivity() {
    console.log('\n🌐 Validating Server Connectivity...');
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    try {
      // Try to fetch a simple endpoint
      const response = await fetch(`${baseUrl}/api/v1/colleges`);
      
      if (response.ok) {
        this.log(`Server is responding at ${baseUrl}`);
      } else {
        this.log(`Server responded with status ${response.status}`, 'warn');
        this.log('Make sure your development server is running: npm run dev', 'info');
      }
    } catch (error) {
      this.log(`Cannot connect to server at ${baseUrl}`, 'warn');
      this.log('Make sure your development server is running: npm run dev', 'info');
    }
  }

  /**
   * Validate directory structure
   */
  validateDirectoryStructure() {
    console.log('\n📁 Validating Directory Structure...');
    
    // Check if results directory can be created
    const resultsDir = path.join(this.baseDir, 'load-testing-results');
    try {
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
        this.log('Results directory created');
      } else {
        this.log('Results directory exists');
      }
      
      // Test write permissions
      const testFile = path.join(resultsDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      this.log('Results directory is writable');
      
    } catch (error) {
      this.log(`Cannot create or write to results directory: ${error.message}`, 'error');
    }
  }

  /**
   * Validate package.json scripts
   */
  validatePackageScripts() {
    console.log('\n📜 Validating Package Scripts...');
    
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const expectedScripts = [
        'test:performance',
        'test:performance:quick',
        'test:load',
        'test:scalability',
        'test:stress',
        'test:performance:all'
      ];
      
      expectedScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.log(`Script '${script}' is configured`);
        } else {
          this.log(`Script '${script}' is missing from package.json`, 'error');
        }
      });
      
    } catch (error) {
      this.log(`Failed to validate package scripts: ${error.message}`, 'error');
    }
  }

  /**
   * Run all validations
   */
  async runAllValidations() {
    console.log('🔧 Performance Testing Setup Validation');
    console.log('=====================================');
    
    this.validateFiles();
    this.validateConfiguration();
    this.validateK6Installation();
    this.validateNodeDependencies();
    await this.validateServerConnectivity();
    this.validateDirectoryStructure();
    this.validatePackageScripts();
    
    console.log('\n📊 Validation Summary');
    console.log('====================');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All validations passed! Performance testing is ready to use.');
      console.log('\nQuick start:');
      console.log('  npm run test:performance:quick');
      return true;
    } else {
      if (this.errors.length > 0) {
        console.log(`❌ ${this.errors.length} error(s) found:`);
        this.errors.forEach(error => console.log(`   - ${error}`));
      }
      
      if (this.warnings.length > 0) {
        console.log(`⚠️ ${this.warnings.length} warning(s) found:`);
        this.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      console.log('\nPlease fix the errors before running performance tests.');
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new SetupValidator();
  validator.runAllValidations().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = SetupValidator;