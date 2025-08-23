// Test setup file for Jest + Puppeteer
const fs = require('fs').promises;
const path = require('path');

// Create necessary directories
beforeAll(async () => {
  const dirs = [
    'tests/screenshots',
    'tests/baseline',
    'tests/comparison',
    'tests/test-results'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
});

// Global test utilities
global.testUtils = {
  // Wait for element to be visible
  waitForElement: async (page, selector, timeout = 5000) => {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // Take screenshot with timestamp
  takeScreenshot: async (page, name) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, 'screenshots', filename);
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    
    return filepath;
  },
  
  // Check if element is in viewport
  isElementInViewport: async (page, selector) => {
    return await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);
  },
  
  // Scroll element into view
  scrollToElement: async (page, selector) => {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, selector);
    
    // Wait for scroll animation
    await page.waitForTimeout(500);
  },
  
  // Get computed styles
  getComputedStyles: async (page, selector, properties) => {
    return await page.evaluate((sel, props) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      const styles = window.getComputedStyle(element);
      const result = {};
      
      props.forEach(prop => {
        result[prop] = styles.getPropertyValue(prop);
      });
      
      return result;
    }, selector, properties);
  },
  
  // Check for console errors
  getConsoleErrors: async (page) => {
    return await page.evaluate(() => {
      return window.consoleErrors || [];
    });
  },
  
  // Simulate user interaction
  simulateUserInteraction: async (page, selector, action = 'click') => {
    switch (action) {
      case 'click':
        await page.click(selector);
        break;
      case 'hover':
        await page.hover(selector);
        break;
      case 'focus':
        await page.focus(selector);
        break;
      case 'type':
        await page.type(selector, 'test input');
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Wait for any animations or state changes
    await page.waitForTimeout(300);
  },
  
  // Performance monitoring
  getPerformanceMetrics: async (page) => {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const memory = performance.memory;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        memory: memory ? {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        } : null
      };
    });
  },
  
  // Accessibility testing
  checkAccessibility: async (page) => {
    return await page.evaluate(() => {
      const issues = [];
      
      // Check for images without alt text
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt) {
          issues.push(`Image ${index} missing alt text`);
        }
      });
      
      // Check for buttons without accessible labels
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button, index) => {
        const hasText = button.textContent.trim().length > 0;
        const hasAriaLabel = button.getAttribute('aria-label');
        const hasAriaLabelledby = button.getAttribute('aria-labelledby');
        
        if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
          issues.push(`Button ${index} missing accessible label`);
        }
      });
      
      // Check for proper heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      headings.forEach((heading, index) => {
        const currentLevel = parseInt(heading.tagName.charAt(1));
        if (currentLevel - previousLevel > 1) {
          issues.push(`Heading hierarchy skip at index ${index}: h${previousLevel} to h${currentLevel}`);
        }
        previousLevel = currentLevel;
      });
      
      return issues;
    });
  }
};

// Global test configuration
global.testConfig = {
  baseUrl: 'http://localhost:3000',
  viewports: {
    desktop: { width: 1920, height: 1080 },
    laptop: { width: 1366, height: 768 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  timeouts: {
    navigation: 30000,
    element: 10000,
    animation: 1000
  },
  performance: {
    maxLoadTime: 3000,
    maxFCP: 1800,
    maxLCP: 2500,
    maxCLS: 0.1
  }
};

// Console logging for tests
console.log('🧪 Test environment configured');
console.log(`📍 Base URL: ${global.testConfig.baseUrl}`);
console.log(`⏱️  Timeouts:`, global.testConfig.timeouts);
console.log(`📊 Performance targets:`, global.testConfig.performance);
