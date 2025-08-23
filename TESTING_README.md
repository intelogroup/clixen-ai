# 🧪 Comprehensive Testing Framework

This project includes a comprehensive testing setup using both **Playwright** and **Puppeteer** to ensure your application is thoroughly tested across different scenarios.

## 🎯 Testing Overview

### **Playwright Tests** (Frontend)
- **Location**: `frontend/tests/`
- **Purpose**: Component-level testing, user interactions, accessibility
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Features**: Visual testing, responsive design, cross-browser compatibility

### **Puppeteer Tests** (Root)
- **Location**: `tests/`
- **Purpose**: Performance testing, security testing, load testing
- **Features**: Performance metrics, security scanning, visual regression

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Playwright browsers
cd frontend
npm run test:install

# Install Jest for Puppeteer tests
npm install --save-dev jest
```

### 2. Start Frontend Server

```bash
cd frontend
npm run dev
```

### 3. Run All Tests

```bash
# Run comprehensive test suite
npm run test:all

# Or use the test runner script
node scripts/run-comprehensive-tests.js
```

## 📋 Available Test Commands

### Playwright Commands

```bash
# Run all Playwright tests
npm run test:playwright

# Run tests with UI
npm run test:playwright:ui

# Run tests in headed mode (see browser)
npm run test:playwright:headed

# Run tests in debug mode
npm run test:playwright:debug

# Show test report
npm run test:playwright:report

# Update snapshots
npm run test:playwright:update-snapshots
```

### Puppeteer Commands

```bash
# Run all Puppeteer tests
npm run test:puppeteer

# Run tests in watch mode
npm run test:puppeteer:watch

# Run tests with coverage
npm run test:puppeteer:coverage

# Run specific test categories
npm run test:visual        # Visual regression tests
npm run test:performance   # Performance tests
npm run test:accessibility # Accessibility tests
npm run test:security      # Security tests
```

### Combined Commands

```bash
# Run all tests (Playwright + Puppeteer)
npm run test:all

# Run comprehensive test suite with reporting
node scripts/run-comprehensive-tests.js
```

## 🎭 Playwright Test Structure

### Test Files

```
frontend/tests/
├── landing-page.spec.ts      # Landing page functionality
├── auth-modal.spec.ts        # Authentication modal
└── components/               # Component-specific tests
    ├── hero.spec.ts
    ├── features.spec.ts
    └── pricing.spec.ts
```

### Test Categories

1. **Landing Page Tests**
   - Page loading and rendering
   - Hero section functionality
   - Feature showcase
   - How it works section
   - Pricing section
   - Footer and navigation

2. **Authentication Tests**
   - Modal opening/closing
   - Form validation
   - Sign in/up switching
   - Error handling
   - Google OAuth
   - Accessibility features

3. **Responsive Design Tests**
   - Mobile viewport testing
   - Tablet viewport testing
   - Desktop viewport testing
   - Mobile menu functionality

4. **User Interaction Tests**
   - Button clicks and hover effects
   - Form submissions
   - Smooth scrolling
   - Keyboard navigation

5. **Performance Tests**
   - Page load times
   - Core Web Vitals
   - Animation performance
   - Memory usage

## 🤖 Puppeteer Test Structure

### Test Categories

1. **Performance Testing**
   - Page load performance
   - Core Web Vitals measurement
   - Memory usage monitoring
   - Large content handling

2. **Cross-Browser Compatibility**
   - Multiple viewport testing
   - User agent simulation
   - Rendering consistency
   - Screenshot comparison

3. **Accessibility Testing**
   - WCAG 2.1 AA compliance
   - Color contrast checking
   - Keyboard navigation
   - Screen reader support
   - ARIA attributes validation

4. **Security Testing**
   - Sensitive data exposure
   - XSS prevention
   - Security headers
   - Input validation

5. **Error Handling**
   - Network error simulation
   - JavaScript error handling
   - Offline mode testing
   - Graceful degradation

6. **Visual Regression Testing**
   - Baseline screenshot capture
   - Comparison screenshot generation
   - Visual consistency validation

7. **Load Testing**
   - Concurrent user simulation
   - Rapid navigation testing
   - Performance under stress

## ⚙️ Configuration

### Playwright Configuration

```typescript
// frontend/playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: ['html', 'json', 'junit'],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

## 📊 Test Reports

### Playwright Reports

```bash
# Generate HTML report
npm run test:playwright

# View report
npm run test:playwright:report
```

Reports are generated in:
- `frontend/test-results/` - Test results and artifacts
- `frontend/playwright-report/` - HTML report

### Puppeteer Reports

```bash
# Generate coverage report
npm run test:puppeteer:coverage
```

Reports are generated in:
- `coverage/` - Code coverage reports
- `test-results/` - Test results and screenshots

### Comprehensive Report

```bash
# Run comprehensive test suite
node scripts/run-comprehensive-tests.js
```

Generates a comprehensive report in:
- `test-results/comprehensive-report.json` - Detailed test results
- Console output with summary and recommendations

## 🔧 Test Utilities

### Global Test Utilities

```javascript
// Available in all Puppeteer tests
global.testUtils = {
  waitForElement: async (page, selector, timeout),
  takeScreenshot: async (page, name),
  isElementInViewport: async (page, selector),
  scrollToElement: async (page, selector),
  getComputedStyles: async (page, selector, properties),
  getConsoleErrors: async (page),
  simulateUserInteraction: async (page, selector, action),
  getPerformanceMetrics: async (page),
  checkAccessibility: async (page)
};
```

### Test Configuration

```javascript
global.testConfig = {
  baseUrl: 'http://localhost:3000',
  viewports: { desktop, laptop, tablet, mobile },
  timeouts: { navigation, element, animation },
  performance: { maxLoadTime, maxFCP, maxLCP, maxCLS }
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Frontend Server Not Running**
   ```bash
   cd frontend && npm run dev
   ```

2. **Playwright Browsers Not Installed**
   ```bash
   cd frontend && npm run test:install
   ```

3. **Jest Not Available**
   ```bash
   npm install --save-dev jest
   ```

4. **Port 3000 Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or change port in configuration
   ```

5. **Test Timeouts**
   - Increase timeout values in configuration
   - Check for slow network or resource loading
   - Verify frontend performance

### Debug Mode

```bash
# Playwright debug mode
npm run test:playwright:debug

# Puppeteer watch mode
npm run test:puppeteer:watch
```

### Verbose Logging

```bash
# Enable verbose logging
DEBUG=* npm run test:playwright
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Comprehensive Testing
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test:install
      - run: cd frontend && npm run build
      - run: cd frontend && npm run start &
      - run: sleep 10
      - run: npm run test:all
```

### Environment Variables

```bash
# Required for CI/CD
CI=true
NODE_ENV=test
PLAYWRIGHT_HEADLESS=true
```

## 🎯 Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Keep tests independent** - no shared state between tests
4. **Use beforeEach/afterEach** for setup and cleanup
5. **Test both positive and negative scenarios**

### Performance Testing

1. **Set realistic performance budgets**
2. **Test on multiple devices and viewports**
3. **Monitor Core Web Vitals**
4. **Check for memory leaks**
5. **Validate under load**

### Accessibility Testing

1. **Follow WCAG 2.1 AA guidelines**
2. **Test keyboard navigation**
3. **Verify screen reader compatibility**
4. **Check color contrast ratios**
5. **Validate ARIA attributes**

### Security Testing

1. **Check for sensitive data exposure**
2. **Validate input sanitization**
3. **Test XSS prevention**
4. **Verify security headers**
5. **Check authentication flows**

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Jest Documentation](https://jestjs.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)

## 🤝 Contributing

When adding new tests:

1. **Follow existing patterns** and naming conventions
2. **Add appropriate test categories** and descriptions
3. **Include both positive and negative test cases**
4. **Update this documentation** if adding new features
5. **Ensure tests are fast and reliable**

---

**Happy Testing! 🧪✨**
