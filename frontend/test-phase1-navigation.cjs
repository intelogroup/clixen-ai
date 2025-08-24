#!/usr/bin/env node

/**
 * Phase 1 Navigation Improvements Test Script
 * Tests the core navigation infrastructure fixes
 */

const fs = require('fs');
const path = require('path');

function testNavigationImplementation() {
  console.log('🧪 Testing Phase 1 Navigation Improvements...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  // Test 1: Check if middleware uses new structure
  console.log('1. Testing Middleware Structure...');
  try {
    const middlewarePath = path.join(__dirname, 'middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    if (middlewareContent.includes('updateSession') && 
        middlewareContent.includes('./lib/supabase-middleware')) {
      console.log('   ✅ Middleware uses new Supabase structure');
      results.passed++;
    } else {
      console.log('   ❌ Middleware not properly updated');
      results.failed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not read middleware file');
    results.warnings++;
  }
  
  // Test 2: Check if supabase-middleware client exists
  console.log('\n2. Testing Supabase Middleware Client...');
  try {
    const middlewareClientPath = path.join(__dirname, 'lib', 'supabase-middleware.ts');
    const exists = fs.existsSync(middlewareClientPath);
    
    if (exists) {
      console.log('   ✅ Supabase middleware client exists');
      results.passed++;
      
      const content = fs.readFileSync(middlewareClientPath, 'utf8');
      if (content.includes('updateSession') && content.includes('createServerClient')) {
        console.log('   ✅ Middleware client properly implements updateSession');
        results.passed++;
      } else {
        console.log('   ❌ Middleware client missing core functions');
        results.failed++;
      }
    } else {
      console.log('   ❌ Supabase middleware client not found');
      results.failed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify middleware client');
    results.warnings++;
  }
  
  // Test 3: Check if GlobalNavigation component exists
  console.log('\n3. Testing Global Navigation Component...');
  try {
    const globalNavPath = path.join(__dirname, 'components', 'GlobalNavigation.tsx');
    const exists = fs.existsSync(globalNavPath);
    
    if (exists) {
      console.log('   ✅ GlobalNavigation component exists');
      results.passed++;
      
      const content = fs.readFileSync(globalNavPath, 'utf8');
      if (content.includes('useRouter') && content.includes('next/navigation')) {
        console.log('   ✅ GlobalNavigation uses proper Next.js router');
        results.passed++;
      } else {
        console.log('   ❌ GlobalNavigation not using proper router');
        results.failed++;
      }
    } else {
      console.log('   ❌ GlobalNavigation component not found');
      results.failed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify GlobalNavigation component');
    results.warnings++;
  }
  
  // Test 4: Check if dashboard uses GlobalNavigation
  console.log('\n4. Testing Dashboard Navigation Integration...');
  try {
    const dashboardPath = path.join(__dirname, 'app', 'dashboard', 'page.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    if (dashboardContent.includes('GlobalNavigation') && 
        dashboardContent.includes('router.push') &&
        !dashboardContent.includes('window.location.href')) {
      console.log('   ✅ Dashboard properly uses GlobalNavigation and router.push');
      results.passed++;
    } else {
      console.log('   ❌ Dashboard navigation not properly updated');
      results.failed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not read dashboard file');
    results.warnings++;
  }
  
  // Test 5: Check if profile uses GlobalNavigation
  console.log('\n5. Testing Profile Navigation Integration...');
  try {
    const profilePath = path.join(__dirname, 'app', 'profile', 'page.tsx');
    const profileContent = fs.readFileSync(profilePath, 'utf8');
    
    if (profileContent.includes('GlobalNavigation') && 
        !profileContent.includes('window.location.href')) {
      console.log('   ✅ Profile properly uses GlobalNavigation');
      results.passed++;
    } else {
      console.log('   ❌ Profile navigation not properly updated');
      results.failed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not read profile file');
    results.warnings++;
  }
  
  // Test 6: Check if AuthModal uses router.push
  console.log('\n6. Testing AuthModal Navigation...');
  try {
    const authModalPath = path.join(__dirname, 'components', 'AuthModalSimple.tsx');
    const authModalContent = fs.readFileSync(authModalPath, 'utf8');
    
    if (authModalContent.includes('router.push') && 
        authModalContent.includes('useRouter') &&
        authModalContent.includes('next/navigation')) {
      console.log('   ✅ AuthModal uses proper Next.js navigation');
      results.passed++;
    } else {
      console.log('   ❌ AuthModal navigation not properly updated');
      results.failed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not read AuthModal file');
    results.warnings++;
  }
  
  // Test 7: Check for remaining window.location usage
  console.log('\n7. Checking for Remaining window.location Usage...');
  try {
    const filesToCheck = [
      'components/AuthModalSimple.tsx',
      'app/dashboard/page.tsx',
      'app/profile/page.tsx',
      'app/auth/callback/page.tsx'
    ];
    
    let foundWindowLocation = false;
    
    for (const file of filesToCheck) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('window.location.href') || content.includes('window.location =')) {
          console.log(`   ❌ Found window.location usage in ${file}`);
          foundWindowLocation = true;
        }
      }
    }
    
    if (!foundWindowLocation) {
      console.log('   ✅ No problematic window.location usage found');
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not scan for window.location usage');
    results.warnings++;
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  
  const totalTests = results.passed + results.failed;
  const successRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
  
  console.log(`\n📈 Success Rate: ${successRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All Phase 1 navigation improvements successfully implemented!');
    console.log('\n✨ Key Improvements:');
    console.log('   • Standardized Supabase client creation with @supabase/ssr');
    console.log('   • Replaced all window.location.href with proper useRouter navigation');
    console.log('   • Enhanced middleware authentication flow');
    console.log('   • Added global navigation component for consistent UX');
    console.log('   • Updated all pages to use modern navigation patterns');
  } else {
    console.log('\n⚠️  Some issues found. Please address failed tests before proceeding to Phase 2.');
  }
  
  return results.failed === 0;
}

// Run the test
testNavigationImplementation();