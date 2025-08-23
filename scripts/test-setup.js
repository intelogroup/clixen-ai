#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Framework Setup Verification');
console.log('='.repeat(50));

// Check if Playwright is properly installed
console.log('\n🎭 Checking Playwright setup...');
try {
  const playwrightVersion = execSync('npx playwright --version', { 
    stdio: 'pipe', 
    encoding: 'utf8',
    cwd: path.join(process.cwd(), 'frontend')
  });
  console.log(`✅ Playwright version: ${playwrightVersion.trim()}`);
  
  // Check if browsers are installed
  const browsersDir = path.join(process.cwd(), 'frontend', 'node_modules', '@playwright', 'browsers');
  if (fs.existsSync(browsersDir)) {
    console.log('✅ Playwright browsers directory exists');
  } else {
    console.log('⚠️  Playwright browsers directory not found');
  }
} catch (error) {
  console.log('❌ Playwright not properly configured:', error.message);
}

// Check if Puppeteer is available
console.log('\n🤖 Checking Puppeteer setup...');
try {
  const puppeteerVersion = execSync('npx puppeteer --version', { 
    stdio: 'pipe', 
    encoding: 'utf8' 
  });
  console.log(`✅ Puppeteer version: ${puppeteerVersion.trim()}`);
} catch (error) {
  console.log('❌ Puppeteer not available:', error.message);
}

// Check if Jest is available
console.log('\n⚡ Checking Jest setup...');
try {
  const jestVersion = execSync('npx jest --version', { 
    stdio: 'pipe', 
    encoding: 'utf8' 
  });
  console.log(`✅ Jest version: ${jestVersion.trim()}`);
} catch (error) {
  console.log('❌ Jest not available:', error.message);
}

// Check test configuration files
console.log('\n📁 Checking test configuration files...');
const configFiles = [
  'frontend/playwright.config.ts',
  'jest.config.js',
  'tests/setup.js',
  'tests/puppeteer-comprehensive.spec.js',
  'frontend/tests/landing-page.spec.ts',
  'frontend/tests/auth-modal.spec.ts'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
  const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  
  const testScripts = [
    'test:playwright',
    'test:puppeteer',
    'test:all'
  ];
  
  testScripts.forEach(script => {
    if (rootPackage.scripts[script]) {
      console.log(`✅ ${script} script available`);
    } else {
      console.log(`❌ ${script} script missing`);
    }
  });
  
  const playwrightScripts = [
    'test',
    'test:install',
    'test:ui'
  ];
  
  playwrightScripts.forEach(script => {
    if (frontendPackage.scripts[script]) {
      console.log(`✅ ${script} script available in frontend`);
    } else {
      console.log(`❌ ${script} script missing in frontend`);
    }
  });
  
} catch (error) {
  console.log('❌ Error reading package.json files:', error.message);
}

// Check test directories
console.log('\n📂 Checking test directories...');
const testDirs = [
  'frontend/tests',
  'tests',
  'test-results'
];

testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} directory exists`);
  } else {
    console.log(`⚠️  ${dir} directory missing`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('🎯 Setup Verification Complete!');
console.log('\nNext steps:');
console.log('1. Start frontend server: cd frontend && npm run dev');
console.log('2. Run Playwright tests: npm run test:playwright');
console.log('3. Run Puppeteer tests: npm run test:puppeteer');
console.log('4. Run all tests: npm run test:all');
console.log('5. View comprehensive report: node scripts/run-comprehensive-tests.js');
console.log('='.repeat(50));
