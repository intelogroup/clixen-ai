const { chromium } = require('playwright');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Configure Winston logger for testing
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `[${timestamp}] ${level}: ${message} ${metaString}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'auth-test.log'),
      maxsize: 10000000, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  waitTime: 5000,
  credentials: {
    validEmail: 'test@example.com',
    validPassword: 'correctpassword123',
    invalidEmail: 'test@example.com',
    invalidPassword: 'wrongpassword123'
  }
};

// Enhanced error handler with Winston
class AuthTestRunner {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
        total: 0
      },
      performance: {},
      issues: [],
      recommendations: []
    };
    this.startTime = Date.now();
  }

  async runTest(testName, testFunction) {
    const testStart = Date.now();
    logger.info(`Starting test: ${testName}`);
    
    try {
      const result = await testFunction();
      const duration = Date.now() - testStart;
      
      const testResult = {
        name: testName,
        status: result.success ? 'PASSED' : result.warning ? 'WARNING' : 'FAILED',
        duration,
        details: result.details || {},
        issues: result.issues || [],
        recommendations: result.recommendations || []
      };

      this.results.tests.push(testResult);
      
      if (result.success) {
        this.results.summary.passed++;
        logger.info(`Test PASSED: ${testName}`, { duration, details: result.details });
      } else if (result.warning) {
        this.results.summary.warnings++;
        logger.warn(`Test WARNING: ${testName}`, { duration, issues: result.issues });
      } else {
        this.results.summary.failed++;
        logger.error(`Test FAILED: ${testName}`, { duration, issues: result.issues });
      }

      // Collect issues and recommendations
      this.results.issues.push(...(result.issues || []));
      this.results.recommendations.push(...(result.recommendations || []));

    } catch (error) {
      const duration = Date.now() - testStart;
      logger.error(`Test CRASHED: ${testName}`, { 
        duration, 
        error: error.message,
        stack: error.stack 
      });
      
      this.results.tests.push({
        name: testName,
        status: 'CRASHED',
        duration,
        error: error.message
      });
      
      this.results.summary.failed++;
      this.results.issues.push(`${testName} crashed: ${error.message}`);
    }
    
    this.results.summary.total++;
  }

  async setupBrowser() {
    logger.info('Setting up browser environment');
    
    try {
      const browser = await chromium.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const page = await browser.newPage();

      // Enhanced browser logging
      page.on('console', msg => {
        const level = msg.type() === 'error' ? 'error' : 'debug';
        logger.log(level, `Browser Console [${msg.type()}]: ${msg.text()}`);
      });

      page.on('pageerror', error => {
        logger.error('Browser Page Error', { 
          error: error.message,
          stack: error.stack 
        });
      });

      page.on('requestfailed', request => {
        logger.warn('Failed HTTP Request', {
          url: request.url(),
          method: request.method(),
          error: request.failure()?.errorText
        });
      });

      page.on('response', response => {
        if (!response.ok()) {
          logger.warn('HTTP Error Response', {
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });

      logger.info('Browser setup completed successfully');
      return { browser, page };
    } catch (error) {
      logger.error('Browser setup failed', { error: error.message });
      throw error;
    }
  }

  async testPageNavigation(page) {
    logger.debug('Testing page navigation');
    const navStart = Date.now();
    
    try {
      await page.goto(`${TEST_CONFIG.baseUrl}/auth/signin`, { 
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout
      });

      const loadTime = Date.now() - navStart;
      const url = page.url();
      const title = await page.title();

      logger.info('Page navigation successful', {
        url,
        title,
        loadTime
      });

      return {
        success: true,
        details: { url, title, loadTime },
        issues: []
      };

    } catch (error) {
      const loadTime = Date.now() - navStart;
      logger.error('Page navigation failed', {
        error: error.message,
        loadTime,
        targetUrl: `${TEST_CONFIG.baseUrl}/auth/signin`
      });

      return {
        success: false,
        issues: [`Navigation failed: ${error.message}`],
        recommendations: [
          'Check if Next.js development server is running',
          'Verify BASE_URL configuration',
          'Check network connectivity'
        ]
      };
    }
  }

  async testAuthenticationUI(page) {
    logger.debug('Testing authentication UI elements');
    
    try {
      // Wait for page to fully load
      await page.waitForTimeout(TEST_CONFIG.waitTime);
      
      const elements = {
        emailInput: null,
        passwordInput: null,
        submitButton: null,
        githubButton: null,
        googleButton: null,
        forgotPasswordLink: null
      };

      // Enhanced element detection with detailed logging
      try {
        elements.emailInput = await page.locator('input[type="email"], input[name="email"]').first().isVisible();
        logger.debug('Email input detection', { found: elements.emailInput });
      } catch (error) {
        logger.warn('Email input detection failed', { error: error.message });
        elements.emailInput = false;
      }

      try {
        elements.passwordInput = await page.locator('input[type="password"], input[name="password"]').first().isVisible();
        logger.debug('Password input detection', { found: elements.passwordInput });
      } catch (error) {
        logger.warn('Password input detection failed', { error: error.message });
        elements.passwordInput = false;
      }

      try {
        const submitButtons = await page.locator('button[type="submit"], button:has-text("Sign In")').count();
        elements.submitButton = submitButtons > 0;
        logger.debug('Submit button detection', { found: elements.submitButton, count: submitButtons });
      } catch (error) {
        logger.warn('Submit button detection failed', { error: error.message });
        elements.submitButton = false;
      }

      try {
        elements.githubButton = await page.locator('button:has-text("GitHub"), button:has-text("github")').first().isVisible();
        logger.debug('GitHub button detection', { found: elements.githubButton });
      } catch (error) {
        logger.warn('GitHub button detection failed', { error: error.message });
        elements.githubButton = false;
      }

      try {
        elements.googleButton = await page.locator('button:has-text("Google"), button:has-text("google")').first().isVisible();
        logger.debug('Google button detection', { found: elements.googleButton });
      } catch (error) {
        logger.warn('Google button detection failed', { error: error.message });
        elements.googleButton = false;
      }

      try {
        elements.forgotPasswordLink = await page.locator('text="Forgot password?"').first().isVisible();
        logger.debug('Forgot password link detection', { found: elements.forgotPasswordLink });
      } catch (error) {
        logger.warn('Forgot password link detection failed', { error: error.message });
        elements.forgotPasswordLink = false;
      }

      // Take screenshot for debugging
      await page.screenshot({ path: path.join(__dirname, 'logs', 'ui-elements-test.png'), fullPage: true });
      logger.info('UI elements screenshot saved');

      // Analyze results
      const issues = [];
      const recommendations = [];

      if (!elements.emailInput || !elements.passwordInput) {
        issues.push('Email/password authentication form not fully available');
        recommendations.push('Check Stack Auth dashboard configuration for email/password method');
      }

      if (!elements.githubButton) {
        issues.push('GitHub OAuth button not found');
        recommendations.push('Verify GitHub OAuth is configured in Stack Auth dashboard');
      }

      if (!elements.googleButton) {
        issues.push('Google OAuth button not found');
        recommendations.push('Verify Google OAuth credentials are configured in Stack Auth dashboard');
      }

      const successfulElements = Object.values(elements).filter(Boolean).length;
      const totalElements = Object.keys(elements).length;

      return {
        success: successfulElements >= 4, // At least 4 out of 6 elements should work
        warning: successfulElements >= 2 && successfulElements < 4,
        details: { 
          elements,
          successRate: `${successfulElements}/${totalElements}`,
          foundElements: successfulElements
        },
        issues,
        recommendations
      };

    } catch (error) {
      logger.error('UI testing failed completely', { error: error.message });
      return {
        success: false,
        issues: [`UI testing crashed: ${error.message}`],
        recommendations: ['Check if authentication page loads correctly']
      };
    }
  }

  async testWrongPasswordValidation(page) {
    logger.debug('Testing wrong password validation');
    
    try {
      // Navigate to fresh signin page
      await page.goto(`${TEST_CONFIG.baseUrl}/auth/signin`);
      await page.waitForTimeout(TEST_CONFIG.waitTime);

      const testStart = Date.now();
      
      // Fill form with wrong credentials
      logger.info('Filling form with invalid credentials');
      
      try {
        await page.fill('input[type="email"]', TEST_CONFIG.credentials.invalidEmail);
        await page.fill('input[type="password"]', TEST_CONFIG.credentials.invalidPassword);
        logger.debug('Form filled successfully', {
          email: TEST_CONFIG.credentials.invalidEmail,
          password: '[REDACTED]'
        });
      } catch (error) {
        logger.error('Form filling failed', { error: error.message });
        return {
          success: false,
          issues: [`Form filling failed: ${error.message}`],
          recommendations: ['Check if email/password inputs are available']
        };
      }

      // Submit form
      logger.info('Submitting form');
      try {
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        logger.debug('Form submitted successfully');
      } catch (error) {
        logger.error('Form submission failed', { error: error.message });
        return {
          success: false,
          issues: [`Form submission failed: ${error.message}`],
          recommendations: ['Check if submit button is available and clickable']
        };
      }

      // Wait for response
      await page.waitForTimeout(3000);
      const responseTime = Date.now() - testStart;
      
      // Check current URL
      const currentUrl = page.url();
      const stayedOnSignin = currentUrl.includes('/signin') || currentUrl.includes('/auth/signin');
      
      logger.info('Authentication response received', {
        currentUrl,
        stayedOnSignin,
        responseTime
      });

      if (!stayedOnSignin) {
        logger.warn('Form redirected instead of showing validation error', { 
          redirectUrl: currentUrl 
        });
        
        if (currentUrl.includes('github.com')) {
          return {
            success: false,
            issues: ['Form redirects to GitHub OAuth instead of processing email/password'],
            recommendations: [
              'Configure Stack Auth dashboard to enable email/password as primary method',
              'Check Stack Auth project settings for authentication method priority'
            ]
          };
        }
        
        return {
          success: false,
          issues: [`Unexpected redirect to: ${currentUrl}`],
          recommendations: ['Check authentication flow configuration']
        };
      }

      // Look for error messages with comprehensive patterns
      logger.debug('Searching for error messages');
      const errorPatterns = [
        { selector: '[role="alert"]', type: 'ARIA Alert' },
        { selector: '.text-red-500, .text-red-600, .text-red-700', type: 'Red Text Classes' },
        { selector: '.bg-red-50, .border-red-500', type: 'Red Background/Border' },
        { selector: '*:has-text("wrong")', type: 'Wrong Text' },
        { selector: '*:has-text("invalid")', type: 'Invalid Text' },
        { selector: '*:has-text("incorrect")', type: 'Incorrect Text' },
        { selector: '*:has-text("error")', type: 'Error Text' },
        { selector: '*:has-text("failed")', type: 'Failed Text' }
      ];

      let errorFound = false;
      let errorDetails = [];

      for (const pattern of errorPatterns) {
        try {
          const elements = page.locator(pattern.selector);
          const count = await elements.count();
          
          if (count > 0) {
            for (let i = 0; i < count; i++) {
              const element = elements.nth(i);
              const isVisible = await element.isVisible();
              
              if (isVisible) {
                const text = await element.textContent();
                if (text && text.trim().length > 0) {
                  errorFound = true;
                  errorDetails.push({
                    type: pattern.type,
                    text: text.trim(),
                    selector: pattern.selector
                  });
                  
                  logger.info('Error message found', {
                    type: pattern.type,
                    message: text.trim()
                  });
                }
              }
            }
          }
        } catch (error) {
          logger.debug('Error pattern check failed', {
            pattern: pattern.selector,
            error: error.message
          });
        }
      }

      // Take screenshot after validation attempt
      await page.screenshot({ 
        path: path.join(__dirname, 'logs', 'wrong-password-validation.png'), 
        fullPage: true 
      });

      if (errorFound) {
        logger.info('Wrong password validation working correctly', {
          errorsFound: errorDetails.length,
          responseTime
        });
        
        return {
          success: true,
          details: {
            stayedOnSignin: true,
            errorMessages: errorDetails,
            responseTime
          },
          issues: []
        };
      } else {
        logger.warn('No error messages found for wrong password', { responseTime });
        
        return {
          success: false,
          warning: true,
          details: {
            stayedOnSignin: true,
            errorMessages: [],
            responseTime
          },
          issues: ['No visible error message displayed for wrong password'],
          recommendations: [
            'Check Stack Auth error message configuration',
            'Verify error styling is visible',
            'Test with different invalid credentials'
          ]
        };
      }

    } catch (error) {
      logger.error('Wrong password validation test failed', { error: error.message });
      return {
        success: false,
        issues: [`Validation test crashed: ${error.message}`],
        recommendations: ['Check authentication form functionality']
      };
    }
  }

  async generateFinalReport() {
    const totalTime = Date.now() - this.startTime;
    
    logger.info('Generating final test report', {
      totalTime,
      summary: this.results.summary
    });

    // Calculate success rate
    const successRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.passed / this.results.summary.total) * 100) 
      : 0;

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Clixen AI Authentication System',
      version: '1.0.0',
      environment: 'development',
      duration: totalTime,
      summary: {
        ...this.results.summary,
        successRate: `${successRate}%`
      },
      tests: this.results.tests,
      issues: [...new Set(this.results.issues)], // Remove duplicates
      recommendations: [...new Set(this.results.recommendations)], // Remove duplicates
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      }
    };

    // Save detailed report
    const reportPath = path.join(__dirname, 'logs', 'auth-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logger.info(`Detailed test report saved to: ${reportPath}`);
    
    return report;
  }

  printSummary(report) {
    console.log('\n🎯 WINSTON-ENHANCED AUTHENTICATION TEST REPORT');
    console.log('===============================================');
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`⏱️  Total Duration: ${report.duration}ms`);
    console.log(`📊 Success Rate: ${report.summary.successRate}`);
    console.log('\n📋 Test Results:');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`🔢 Total: ${report.summary.total}`);

    if (report.tests.length > 0) {
      console.log('\n📝 Individual Test Results:');
      report.tests.forEach((test, index) => {
        const emoji = test.status === 'PASSED' ? '✅' : 
                     test.status === 'WARNING' ? '⚠️' : 
                     test.status === 'CRASHED' ? '💥' : '❌';
        console.log(`${emoji} ${test.name} (${test.duration}ms)`);
      });
    }

    if (report.issues.length > 0) {
      console.log('\n🚨 Issues Identified:');
      report.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log('\n📂 Logs and Screenshots:');
    console.log(`📄 Detailed Log: logs/auth-test.log`);
    console.log(`📊 JSON Report: logs/auth-test-report.json`);
    console.log(`📸 Screenshots: logs/*.png`);
  }
}

// Main test execution
async function runAuthenticationTests() {
  const testRunner = new AuthTestRunner();
  let browser, page;

  try {
    logger.info('🚀 Starting Winston-Enhanced Authentication Test Suite');
    
    // Setup browser
    const browserSetup = await testRunner.setupBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;

    // Run individual tests
    await testRunner.runTest('Page Navigation', () => testRunner.testPageNavigation(page));
    await testRunner.runTest('Authentication UI Elements', () => testRunner.testAuthenticationUI(page));
    await testRunner.runTest('Wrong Password Validation', () => testRunner.testWrongPasswordValidation(page));

    // Generate and display final report
    const report = await testRunner.generateFinalReport();
    testRunner.printSummary(report);

    logger.info('🎉 Test suite completed successfully');

  } catch (error) {
    logger.error('🚨 Test suite failed with critical error', { 
      error: error.message,
      stack: error.stack 
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        logger.info('Browser closed successfully');
      } catch (error) {
        logger.warn('Browser close warning', { error: error.message });
      }
    }
  }
}

// Execute tests
runAuthenticationTests().catch(error => {
  logger.error('Fatal test suite error', { 
    error: error.message,
    stack: error.stack 
  });
  process.exit(1);
});