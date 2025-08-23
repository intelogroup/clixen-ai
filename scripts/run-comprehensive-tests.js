#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      playwright: { passed: 0, failed: 0, total: 0, duration: 0 },
      puppeteer: { passed: 0, failed: 0, total: 0, duration: 0 },
      overall: { passed: 0, failed: 0, total: 0, duration: 0 }
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      header: chalk.cyan.bold
    };
    
    console.log(`${colors[type](`[${timestamp}]`)} ${message}`);
  }

  async runCommand(command, description) {
    try {
      this.log(`🚀 ${description}...`, 'info');
      const startTime = Date.now();
      
      const result = execSync(command, { 
        stdio: 'pipe', 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const duration = Date.now() - startTime;
      this.log(`✅ ${description} completed in ${duration}ms`, 'success');
      
      return { success: true, duration, output: result };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ ${description} failed after ${duration}ms`, 'error');
      this.log(`Error: ${error.message}`, 'error');
      
      return { success: false, duration, error: error.message };
    }
  }

  async checkPrerequisites() {
    this.log('🔍 Checking test prerequisites...', 'header');
    
    // Check if frontend is running
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        this.log('✅ Frontend server is running on port 3000', 'success');
      } else {
        this.log('⚠️  Frontend server responded with non-OK status', 'warning');
      }
    } catch (error) {
      this.log('❌ Frontend server is not running on port 3000', 'error');
      this.log('Please start the frontend with: cd frontend && npm run dev', 'warning');
      return false;
    }
    
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      this.log('✅ Playwright is installed', 'success');
    } catch (error) {
      this.log('❌ Playwright is not installed', 'error');
      this.log('Installing Playwright...', 'info');
      await this.runCommand('cd frontend && npm run test:install', 'Installing Playwright browsers');
    }
    
    // Check if Jest is available
    try {
      execSync('npx jest --version', { stdio: 'pipe' });
      this.log('✅ Jest is available', 'success');
    } catch (error) {
      this.log('❌ Jest is not available', 'error');
      this.log('Installing Jest...', 'info');
      await this.runCommand('npm install --save-dev jest', 'Installing Jest');
    }
    
    return true;
  }

  async runPlaywrightTests() {
    this.log('🎭 Running Playwright tests...', 'header');
    
    const result = await this.runCommand(
      'cd frontend && npm run test',
      'Playwright test suite'
    );
    
    if (result.success) {
      this.results.playwright.passed = this.results.playwright.total;
      this.results.playwright.duration = result.duration;
      this.log(`✅ Playwright tests completed successfully`, 'success');
    } else {
      this.results.playwright.failed = 1;
      this.log(`❌ Playwright tests failed`, 'error');
    }
    
    this.results.playwright.total = this.results.playwright.passed + this.results.playwright.failed;
  }

  async runPuppeteerTests() {
    this.log('🤖 Running Puppeteer tests...', 'header');
    
    const result = await this.runCommand(
      'npm run test:puppeteer',
      'Puppeteer test suite'
    );
    
    if (result.success) {
      this.results.puppeteer.passed = this.results.puppeteer.total;
      this.results.puppeteer.duration = result.duration;
      this.log(`✅ Puppeteer tests completed successfully`, 'success');
    } else {
      this.results.puppeteer.failed = 1;
      this.log(`❌ Puppeteer tests failed`, 'error');
    }
    
    this.results.puppeteer.total = this.results.puppeteer.passed + this.results.puppeteer.failed;
  }

  async generateTestReport() {
    this.log('📊 Generating comprehensive test report...', 'header');
    
    const totalDuration = Date.now() - this.startTime;
    this.results.overall.duration = totalDuration;
    this.results.overall.passed = this.results.playwright.passed + this.results.puppeteer.passed;
    this.results.overall.failed = this.results.playwright.failed + this.results.puppeteer.failed;
    this.results.overall.total = this.results.overall.passed + this.results.overall.failed;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.overall.total,
        passed: this.results.overall.passed,
        failed: this.results.overall.failed,
        successRate: this.results.overall.total > 0 ? 
          ((this.results.overall.passed / this.results.overall.total) * 100).toFixed(2) : 0,
        totalDuration: totalDuration
      },
      details: {
        playwright: this.results.playwright,
        puppeteer: this.results.puppeteer
      },
      recommendations: this.generateRecommendations()
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'test-results', 'comprehensive-report.json');
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Display report
    this.displayReport(report);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.overall.failed > 0) {
      recommendations.push('Review failed tests and fix issues before deployment');
      recommendations.push('Check browser compatibility and viewport responsiveness');
      recommendations.push('Verify accessibility compliance (WCAG 2.1 AA)');
    }
    
    if (this.results.overall.duration > 60000) { // 1 minute
      recommendations.push('Optimize test execution time for faster feedback');
      recommendations.push('Consider parallel test execution');
    }
    
    if (this.results.playwright.passed === 0) {
      recommendations.push('Playwright tests need attention - check configuration');
    }
    
    if (this.results.puppeteer.passed === 0) {
      recommendations.push('Puppeteer tests need attention - check Jest setup');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All tests passing! Ready for production deployment');
      recommendations.push('Consider adding performance benchmarks');
      recommendations.push('Add visual regression testing to CI/CD pipeline');
    }
    
    return recommendations;
  }

  displayReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log(chalk.cyan.bold('🧪 COMPREHENSIVE TEST REPORT'));
    console.log('='.repeat(80));
    
    console.log(`\n📅 Timestamp: ${report.timestamp}`);
    console.log(`⏱️  Total Duration: ${report.summary.totalDuration}ms`);
    
    console.log('\n📊 SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Total Tests: ${chalk.bold(report.summary.totalTests)}`);
    console.log(`Passed: ${chalk.green.bold(report.summary.passed)}`);
    console.log(`Failed: ${chalk.red.bold(report.summary.failed)}`);
    console.log(`Success Rate: ${chalk.cyan.bold(report.summary.successRate)}%`);
    
    console.log('\n🎭 PLAYWRIGHT TESTS');
    console.log('-'.repeat(40));
    console.log(`Status: ${this.results.playwright.failed === 0 ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED')}`);
    console.log(`Duration: ${this.results.playwright.duration}ms`);
    
    console.log('\n🤖 PUPPETEER TESTS');
    console.log('-'.repeat(40));
    console.log(`Status: ${this.results.puppeteer.failed === 0 ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED')}`);
    console.log(`Duration: ${this.results.puppeteer.duration}ms`);
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (report.summary.failed === 0) {
      console.log(chalk.green.bold('🎉 ALL TESTS PASSED! Your application is ready for production!'));
    } else {
      console.log(chalk.red.bold('⚠️  Some tests failed. Please review and fix issues before deployment.'));
    }
    
    console.log('='.repeat(80) + '\n');
  }

  async run() {
    this.log('🚀 Starting Comprehensive Test Suite', 'header');
    this.log(`Working directory: ${process.cwd()}`, 'info');
    
    // Check prerequisites
    const prerequisitesMet = await this.checkPrerequisites();
    if (!prerequisitesMet) {
      this.log('❌ Prerequisites not met. Exiting.', 'error');
      process.exit(1);
    }
    
    // Run Playwright tests
    await this.runPlaywrightTests();
    
    // Run Puppeteer tests
    await this.runPuppeteerTests();
    
    // Generate and display report
    const report = await this.generateTestReport();
    
    // Exit with appropriate code
    if (report.summary.failed > 0) {
      this.log('❌ Test suite completed with failures', 'error');
      process.exit(1);
    } else {
      this.log('✅ Test suite completed successfully', 'success');
      process.exit(0);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.run().catch(error => {
    console.error(chalk.red('❌ Test runner failed:'), error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;
