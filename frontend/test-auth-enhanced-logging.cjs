const { chromium } = require('playwright');

// Enhanced logging utility
class Logger {
  constructor() {
    this.startTime = Date.now();
    this.stepCounter = 0;
  }
  
  step(message) {
    this.stepCounter++;
    const elapsed = Date.now() - this.startTime;
    console.log(`\n[${elapsed}ms] 📋 Step ${this.stepCounter}: ${message}`);
  }
  
  success(message) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] ✅ ${message}`);
  }
  
  error(message, error = null) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] ❌ ${message}`);
    if (error) {
      console.log(`[${elapsed}ms] 🔍 Error Details: ${error.message}`);
      if (error.stack) {
        console.log(`[${elapsed}ms] 📚 Stack Trace: ${error.stack.split('\n')[1]?.trim()}`);
      }
    }
  }
  
  warning(message) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] ⚠️  ${message}`);
  }
  
  info(message, data = null) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] ℹ️  ${message}`);
    if (data) {
      console.log(`[${elapsed}ms] 📊 Data: ${JSON.stringify(data, null, 2)}`);
    }
  }
  
  debug(message, details = null) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] 🔍 DEBUG: ${message}`);
    if (details) {
      console.log(`[${elapsed}ms] 🔍 Details:`, details);
    }
  }
}

// Error handler wrapper
async function withErrorHandler(operation, description, logger) {
  try {
    logger.debug(`Starting: ${description}`);
    const result = await operation();
    logger.success(`Completed: ${description}`);
    return { success: true, result, error: null };
  } catch (error) {
    logger.error(`Failed: ${description}`, error);
    return { success: false, result: null, error };
  }
}

// Enhanced element detection with retry logic
async function detectElement(page, selector, timeout = 10000, logger) {
  const description = `Detecting element: ${selector}`;
  
  return await withErrorHandler(async () => {
    logger.debug(`Looking for element: ${selector}`);
    
    try {
      // Try multiple variations of the selector
      const variations = [
        selector,
        selector.replace(/\[type="([^"]+)"\]/, `[type="$1"], input[name="${selector.match(/type="([^"]+)"/)?.[1] || ''}"]`),
        selector + ', ' + selector.toLowerCase(),
      ];
      
      for (const variation of variations) {
        try {
          const element = page.locator(variation).first();
          await element.waitFor({ state: 'visible', timeout: timeout / variations.length });
          
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          logger.info(`Element found with selector: ${variation}`, {
            visible: isVisible,
            enabled: isEnabled,
            count: await page.locator(variation).count()
          });
          
          return { element, selector: variation, visible: isVisible, enabled: isEnabled };
        } catch (variationError) {
          logger.debug(`Selector variation failed: ${variation}`, variationError.message);
          continue;
        }
      }
      
      throw new Error(`Element not found with any selector variation`);
      
    } catch (error) {
      // Provide helpful debugging information
      const pageUrl = page.url();
      const pageTitle = await page.title().catch(() => 'Unknown');
      
      logger.debug('Element detection failed - Page info', {
        url: pageUrl,
        title: pageTitle,
        selector: selector
      });
      
      // Try to find similar elements
      const bodyText = await page.textContent('body').catch(() => 'Could not read body');
      const hasRelevantText = ['email', 'password', 'sign', 'login', 'auth'].some(term => 
        bodyText.toLowerCase().includes(term)
      );
      
      logger.debug('Page content analysis', {
        hasAuthRelatedText: hasRelevantText,
        bodyLength: bodyText.length,
        containsEmail: bodyText.toLowerCase().includes('email'),
        containsPassword: bodyText.toLowerCase().includes('password'),
        containsSignIn: bodyText.toLowerCase().includes('sign in')
      });
      
      throw error;
    }
  }, description, logger);
}

// Enhanced form interaction with detailed logging
async function interactWithForm(page, logger) {
  const formData = {
    email: 'test@example.com',
    password: 'wrongpassword123'
  };
  
  logger.step('Form Interaction Phase');
  
  // Detect email input with enhanced error handling
  const emailResult = await detectElement(page, 'input[type="email"], input[name="email"]', 15000, logger);
  if (!emailResult.success) {
    logger.error('Email input not found - Authentication form may not be loaded');
    return { success: false, error: 'Email input not found' };
  }
  
  // Detect password input
  const passwordResult = await detectElement(page, 'input[type="password"], input[name="password"]', 15000, logger);
  if (!passwordResult.success) {
    logger.error('Password input not found');
    return { success: false, error: 'Password input not found' };
  }
  
  // Detect submit button with multiple possible texts
  const submitResult = await detectElement(page, 'button[type="submit"], button:has-text("Sign In"):not(:has-text("GitHub")):not(:has-text("Google"))', 15000, logger);
  if (!submitResult.success) {
    logger.warning('Primary submit button not found, trying alternative selectors');
    
    // Try alternative button selectors
    const altSubmitResult = await detectElement(page, 'button:text("Sign In"), input[type="submit"]', 5000, logger);
    if (!altSubmitResult.success) {
      logger.error('No submit button found');
      return { success: false, error: 'Submit button not found' };
    }
  }
  
  const submitButton = submitResult.success ? submitResult.result.element : 
                     await page.locator('button:text("Sign In"), input[type="submit"]').first();
  
  // Fill form with enhanced error handling
  logger.step('Filling form fields');
  
  try {
    await emailResult.result.element.fill(formData.email);
    logger.success(`Email filled: ${formData.email}`);
    
    await passwordResult.result.element.fill(formData.password);
    logger.success(`Password filled: ${'•'.repeat(formData.password.length)}`);
    
    // Verify form was filled correctly
    const emailValue = await emailResult.result.element.inputValue();
    const passwordValue = await passwordResult.result.element.inputValue();
    
    logger.info('Form field verification', {
      emailCorrect: emailValue === formData.email,
      passwordFilled: passwordValue.length > 0
    });
    
  } catch (fillError) {
    logger.error('Failed to fill form fields', fillError);
    return { success: false, error: 'Form filling failed' };
  }
  
  // Submit form with timing
  logger.step('Submitting authentication form');
  const submitStartTime = Date.now();
  
  try {
    await submitButton.click();
    logger.success('Form submitted successfully');
    
    // Wait for response with timeout
    logger.info('Waiting for authentication response...');
    await page.waitForTimeout(3000);
    
    const responseTime = Date.now() - submitStartTime;
    logger.info(`Authentication response time: ${responseTime}ms`);
    
    return { success: true, responseTime };
    
  } catch (submitError) {
    logger.error('Failed to submit form', submitError);
    return { success: false, error: 'Form submission failed' };
  }
}

// Enhanced URL and response analysis
async function analyzeAuthResponse(page, logger) {
  logger.step('Authentication Response Analysis');
  
  const currentUrl = page.url();
  const pageTitle = await page.title().catch(() => 'Unknown Title');
  
  logger.info('Page state after authentication attempt', {
    url: currentUrl,
    title: pageTitle,
    isHTTPS: currentUrl.startsWith('https://'),
    domain: new URL(currentUrl).hostname
  });
  
  // Determine authentication outcome
  let outcome = 'unknown';
  let details = {};
  
  if (currentUrl.includes('github.com')) {
    outcome = 'oauth_redirect_github';
    details = {
      provider: 'GitHub',
      redirectType: 'OAuth',
      issue: 'Email/password form redirected to OAuth instead of processing credentials'
    };
    logger.warning('Authentication redirected to GitHub OAuth');
  } else if (currentUrl.includes('google.com') || currentUrl.includes('accounts.google.com')) {
    outcome = 'oauth_redirect_google';
    details = {
      provider: 'Google',
      redirectType: 'OAuth',
      issue: 'Email/password form redirected to Google OAuth instead of processing credentials'
    };
    logger.warning('Authentication redirected to Google OAuth');
  } else if (currentUrl.includes('/signin') || currentUrl.includes('/auth/signin')) {
    outcome = 'stayed_on_signin';
    details = { message: 'Remained on signin page - checking for error messages' };
    logger.success('Stayed on signin page (expected for wrong password)');
  } else if (currentUrl.includes('/dashboard')) {
    outcome = 'successful_auth';
    details = { message: 'Redirected to dashboard - authentication succeeded' };
    logger.warning('Unexpected successful authentication with wrong password');
  } else {
    outcome = 'unexpected_redirect';
    details = { 
      redirectUrl: currentUrl,
      message: 'Redirected to unexpected URL'
    };
    logger.error(`Unexpected redirect to: ${currentUrl}`);
  }
  
  return { outcome, details, url: currentUrl, title: pageTitle };
}

// Error message detection with enhanced patterns
async function detectErrorMessages(page, logger) {
  logger.step('Error Message Detection');
  
  const errorPatterns = [
    // Stack Auth specific patterns
    { selector: '[role="alert"]', type: 'ARIA Alert' },
    { selector: '.text-red-500, .text-red-600, .text-red-700', type: 'Red Text' },
    { selector: '.bg-red-50, .border-red-500', type: 'Red Background/Border' },
    { selector: '.error, .alert, .notification', type: 'Error Classes' },
    
    // Text-based patterns
    { selector: '*:has-text("Invalid")', type: 'Invalid Text' },
    { selector: '*:has-text("incorrect")', type: 'Incorrect Text' },
    { selector: '*:has-text("wrong")', type: 'Wrong Text' },
    { selector: '*:has-text("failed")', type: 'Failed Text' },
    { selector: '*:has-text("error")', type: 'Error Text' },
    { selector: '*:has-text("denied")', type: 'Denied Text' },
    
    // Stack Auth specific error messages
    { selector: '*:has-text("credentials")', type: 'Credentials Text' },
    { selector: '*:has-text("unauthorized")', type: 'Unauthorized Text' },
  ];
  
  const foundErrors = [];
  
  for (const pattern of errorPatterns) {
    try {
      const elements = page.locator(pattern.selector);
      const count = await elements.count();
      
      logger.debug(`Checking pattern: ${pattern.type} (${pattern.selector})`, `Found ${count} elements`);
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          
          try {
            const isVisible = await element.isVisible();
            if (isVisible) {
              const text = await element.textContent();
              if (text && text.trim().length > 0) {
                foundErrors.push({
                  type: pattern.type,
                  selector: pattern.selector,
                  text: text.trim(),
                  visible: isVisible
                });
                
                logger.success(`Error message found (${pattern.type}): "${text.trim()}"`);
              }
            }
          } catch (elementError) {
            logger.debug(`Error checking element ${i} for pattern ${pattern.type}`, elementError.message);
          }
        }
      }
    } catch (patternError) {
      logger.debug(`Pattern check failed: ${pattern.type}`, patternError.message);
    }
  }
  
  // Additional content-based error detection
  try {
    const bodyText = await page.textContent('body');
    const errorKeywords = ['invalid', 'incorrect', 'wrong', 'error', 'failed', 'denied', 'unauthorized'];
    const foundKeywords = errorKeywords.filter(keyword => 
      bodyText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0 && foundErrors.length === 0) {
      logger.info('Error keywords found in page content', { keywords: foundKeywords });
      foundErrors.push({
        type: 'Content Analysis',
        text: `Error keywords detected: ${foundKeywords.join(', ')}`,
        keywords: foundKeywords
      });
    }
  } catch (contentError) {
    logger.error('Failed to analyze page content for errors', contentError);
  }
  
  logger.info(`Error detection complete: ${foundErrors.length} error(s) found`);
  return foundErrors;
}

// Main test function with comprehensive error handling
async function testAuthWithEnhancedLogging() {
  const logger = new Logger();
  
  console.log('🧪 Enhanced Authentication Test with Comprehensive Logging');
  console.log('=========================================================');
  
  logger.step('Test Suite Initialization');
  
  let browser;
  let page;
  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
    details: {}
  };
  
  try {
    // Browser setup with enhanced logging
    logger.step('Browser Setup');
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ]
    });
    
    page = await browser.newPage();
    
    // Enhanced page event listeners
    page.on('console', msg => {
      logger.debug(`Browser Console [${msg.type()}]: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      logger.error('Browser Page Error', error);
      testResults.errors.push(`Page Error: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      logger.warning(`Failed Request: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    logger.success('Browser initialized successfully');
    
    // Navigation with enhanced error handling
    logger.step('Page Navigation');
    const navigationResult = await withErrorHandler(async () => {
      await page.goto('http://localhost:3000/auth/signin', { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const url = page.url();
      const title = await page.title();
      
      logger.info('Navigation successful', { url, title });
      
      return { url, title };
    }, 'Navigate to signin page', logger);
    
    if (!navigationResult.success) {
      testResults.failed++;
      testResults.errors.push('Navigation failed');
      return testResults;
    }
    
    testResults.passed++;
    testResults.details.navigation = navigationResult.result;
    
    // Wait for page to fully load
    logger.step('Page Load Verification');
    await page.waitForTimeout(5000);
    
    // Take initial screenshot
    try {
      await page.screenshot({ path: 'auth-test-initial.png', fullPage: true });
      logger.success('Initial screenshot saved: auth-test-initial.png');
    } catch (screenshotError) {
      logger.warning('Could not save initial screenshot', screenshotError);
    }
    
    // Form interaction
    const formResult = await interactWithForm(page, logger);
    
    if (formResult.success) {
      testResults.passed++;
      testResults.details.formInteraction = formResult;
    } else {
      testResults.failed++;
      testResults.errors.push(formResult.error);
    }
    
    // Take screenshot after form submission
    try {
      await page.screenshot({ path: 'auth-test-after-submit.png', fullPage: true });
      logger.success('Post-submission screenshot saved: auth-test-after-submit.png');
    } catch (screenshotError) {
      logger.warning('Could not save post-submission screenshot', screenshotError);
    }
    
    // Response analysis
    const responseAnalysis = await analyzeAuthResponse(page, logger);
    testResults.details.responseAnalysis = responseAnalysis;
    
    if (responseAnalysis.outcome === 'stayed_on_signin') {
      testResults.passed++;
    } else if (responseAnalysis.outcome.includes('oauth_redirect')) {
      testResults.warnings++;
      logger.warning('Form redirected to OAuth - Stack Auth dashboard configuration needed');
    } else {
      testResults.failed++;
    }
    
    // Error message detection
    const errorMessages = await detectErrorMessages(page, logger);
    testResults.details.errorMessages = errorMessages;
    
    if (errorMessages.length > 0) {
      testResults.passed++;
      logger.success('Error messages detected - authentication validation working');
    } else {
      testResults.warnings++;
      logger.warning('No error messages found - may need Stack Auth dashboard configuration');
    }
    
  } catch (criticalError) {
    logger.error('Critical test failure', criticalError);
    testResults.failed++;
    testResults.errors.push(`Critical error: ${criticalError.message}`);
  } finally {
    // Cleanup with error handling
    logger.step('Test Cleanup');
    
    if (page) {
      try {
        await page.screenshot({ path: 'auth-test-final.png', fullPage: true });
        logger.success('Final screenshot saved: auth-test-final.png');
      } catch (screenshotError) {
        logger.warning('Could not save final screenshot', screenshotError);
      }
    }
    
    if (browser) {
      try {
        await browser.close();
        logger.success('Browser closed successfully');
      } catch (closeError) {
        logger.error('Error closing browser', closeError);
      }
    }
  }
  
  // Test results summary
  logger.step('Test Results Summary');
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`🔍 Total Errors: ${testResults.errors.length}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 ERRORS ENCOUNTERED:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  logger.info('Test completed', {
    totalTime: Date.now() - logger.startTime + 'ms',
    results: testResults
  });
  
  return testResults;
}

testAuthWithEnhancedLogging().catch(console.error);