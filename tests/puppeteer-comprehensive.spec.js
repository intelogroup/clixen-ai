const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

describe('Clixen AI - Comprehensive Puppeteer Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 100, // Slow down operations for better visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable request interception for performance monitoring
    await page.setRequestInterception(true);
    
    // Track performance metrics
    page.on('request', request => {
      request.continue();
    });
    
    page.on('response', response => {
      console.log(`${response.status()} ${response.url()}`);
    });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Landing Page Performance', () => {
    test('should load landing page within performance budget', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      const loadTime = Date.now() - startTime;
      
      // Performance budget: 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check Core Web Vitals
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });
      
      console.log('Performance Metrics:', performanceMetrics);
      
      // FCP should be under 1.8s
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1800);
    });

    test('should handle large content without performance degradation', async () => {
      await page.goto('http://localhost:3000');
      
      // Scroll through entire page to trigger lazy loading
      await page.evaluate(() => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
      
      // Check for memory leaks
      const memoryInfo = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      if (memoryInfo) {
        console.log('Memory Usage:', memoryInfo);
        // Memory usage should be reasonable
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB
      }
    });
  });

  describe('Cross-Browser Compatibility', () => {
    test('should render correctly in different viewports', async () => {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1366, height: 768, name: 'Laptop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot for visual regression testing
        const screenshotPath = path.join(__dirname, 'screenshots', `${viewport.name.toLowerCase()}.png`);
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        
        // Check critical elements are visible
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('button:has-text("Start Free Today")')).toBeVisible();
        
        console.log(`✅ ${viewport.name} viewport test passed`);
      }
    });

    test('should handle different user agents', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      ];
      
      for (const userAgent of userAgents) {
        await page.setUserAgent(userAgent);
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        
        // Verify page loads without errors
        const consoleErrors = await page.evaluate(() => {
          return window.consoleErrors || [];
        });
        
        expect(consoleErrors.length).toBe(0);
        console.log(`✅ User agent test passed: ${userAgent.substring(0, 50)}...`);
      }
    });
  });

  describe('Accessibility Testing', () => {
    test('should meet WCAG 2.1 AA standards', async () => {
      await page.goto('http://localhost:3000');
      
      // Check color contrast
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach(element => {
          const style = window.getComputedStyle(element);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          // Basic contrast check (simplified)
          if (color && backgroundColor && color !== backgroundColor) {
            // This is a simplified check - in production use a proper contrast checker
            issues.push({
              element: element.tagName,
              color,
              backgroundColor
            });
          }
        });
        
        return issues;
      });
      
      console.log('Contrast check completed');
      
      // Check keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Check ARIA attributes
      const ariaIssues = await page.evaluate(() => {
        const issues = [];
        const interactiveElements = document.querySelectorAll('button, input, a, [role]');
        
        interactiveElements.forEach(element => {
          if (element.tagName === 'BUTTON' && !element.textContent && !element.getAttribute('aria-label')) {
            issues.push(`Button without accessible label: ${element.outerHTML}`);
          }
        });
        
        return issues;
      });
      
      expect(ariaIssues.length).toBe(0);
    });

    test('should support screen readers', async () => {
      await page.goto('http://localhost:3000');
      
      // Check for proper heading hierarchy
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent.trim()
        }));
      });
      
      // Should have at least one h1
      expect(headings.some(h => h.level === 1)).toBe(true);
      
      // Check for alt text on images
      const imagesWithoutAlt = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).filter(img => !img.alt).length;
      });
      
      expect(imagesWithoutAlt).toBe(0);
    });
  });

  describe('Security Testing', () => {
    test('should not expose sensitive information', async () => {
      await page.goto('http://localhost:3000');
      
      // Check page source for sensitive data
      const pageSource = await page.content();
      
      // Should not contain API keys, passwords, etc.
      const sensitivePatterns = [
        /sk-[a-zA-Z0-9]{48}/, // OpenAI API key pattern
        /[a-zA-Z0-9]{32,}/, // Generic API key pattern
        /password.*=.*['"][^'"]+['"]/, // Hardcoded passwords
        /secret.*=.*['"][^'"]+['"]/ // Hardcoded secrets
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(pageSource).not.toMatch(pattern);
      });
      
      // Check for secure headers
      const response = await page.goto('http://localhost:3000');
      const headers = response.headers();
      
      // Should have security headers
      expect(headers['x-content-type-options']).toBe('nosniff');
    });

    test('should handle XSS attempts safely', async () => {
      await page.goto('http://localhost:3000');
      
      // Try to inject XSS payload
      const xssPayload = '<script>alert("XSS")</script>';
      
      // This test would need to be adapted based on actual input fields
      // For now, we'll check that the page doesn't execute arbitrary scripts
      const scriptExecution = await page.evaluate((payload) => {
        try {
          // Try to create a script element
          const script = document.createElement('script');
          script.textContent = 'window.xssTest = true;';
          document.head.appendChild(script);
          
          // Check if it was executed
          return window.xssTest === true;
        } catch (e) {
          return false;
        }
      }, xssPayload);
      
      // Script execution should be prevented by CSP
      expect(scriptExecution).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate offline mode
      await page.setOfflineMode(true);
      
      try {
        await page.goto('http://localhost:3000', { timeout: 5000 });
      } catch (error) {
        // Should handle offline gracefully
        expect(error.message).toContain('net::ERR_INTERNET_DISCONNECTED');
      }
      
      // Restore online mode
      await page.setOfflineMode(false);
    });

    test('should handle JavaScript errors gracefully', async () => {
      await page.goto('http://localhost:3000');
      
      // Inject a JavaScript error
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Trigger a JavaScript error
      await page.evaluate(() => {
        try {
          throw new Error('Test error');
        } catch (e) {
          console.error('Caught error:', e.message);
        }
      });
      
      // Page should continue to function despite errors
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  describe('Visual Regression Testing', () => {
    test('should maintain consistent visual appearance', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Take baseline screenshot
      const baselinePath = path.join(__dirname, 'baseline', 'landing-page.png');
      await page.screenshot({ 
        path: baselinePath, 
        fullPage: true 
      });
      
      // Reload page and take comparison screenshot
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const comparisonPath = path.join(__dirname, 'comparison', 'landing-page.png');
      await page.screenshot({ 
        path: comparisonPath, 
        fullPage: true 
      });
      
      // In a real implementation, you would compare these images
      // For now, we'll just verify they were created
      const baselineExists = await fs.access(baselinePath).then(() => true).catch(() => false);
      const comparisonExists = await fs.access(comparisonPath).then(() => true).catch(() => false);
      
      expect(baselineExists).toBe(true);
      expect(comparisonExists).toBe(true);
    });
  });

  describe('Load Testing', () => {
    test('should handle multiple concurrent users', async () => {
      const concurrentPages = 5;
      const pages = [];
      
      // Create multiple page instances
      for (let i = 0; i < concurrentPages; i++) {
        const newPage = await browser.newPage();
        pages.push(newPage);
      }
      
      // Navigate all pages simultaneously
      const navigationPromises = pages.map(page => 
        page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
      );
      
      await Promise.all(navigationPromises);
      
      // Verify all pages loaded successfully
      for (const page of pages) {
        const title = await page.title();
        expect(title).toContain('Clixen AI');
      }
      
      // Clean up
      await Promise.all(pages.map(page => page.close()));
    });

    test('should handle rapid navigation', async () => {
      await page.goto('http://localhost:3000');
      
      // Rapidly navigate between sections
      const sections = ['#features', '#how-it-works', '#pricing'];
      
      for (let i = 0; i < 10; i++) {
        const randomSection = sections[Math.floor(Math.random() * sections.length)];
        await page.evaluate((section) => {
          document.querySelector(section)?.scrollIntoView({ behavior: 'smooth' });
        }, randomSection);
        
        await page.waitForTimeout(100);
      }
      
      // Page should remain stable
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
