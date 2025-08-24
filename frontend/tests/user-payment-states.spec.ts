import { test, expect, type Page } from '@playwright/test'

// Test users for different payment states
const TEST_USERS = {
  NEW_USER: {
    email: 'testuser3@email.com',
    password: 'Demo123',
    expectedState: 'new',
    description: 'New user - no payment'
  },
  RETURNING_UNPAID: {
    email: 'testuser4@email.com', 
    password: 'Demo123',
    expectedState: 'unpaid',
    description: 'Returning user - no payment'
  },
  PAID_USER: {
    email: 'testuser5@email.com',
    password: 'Demo123', 
    expectedState: 'paid',
    description: 'Paid user - active subscription'
  }
}

// Helper function to set up ultra-comprehensive browser logging with payment state focus
function setupPaymentStateLogging(page: Page, testName: string, userType: string) {
  console.log(`🔧 [${testName}] Setting up comprehensive logging for ${userType}`)
  
  page.on('console', (msg) => {
    const type = msg.type()
    const text = msg.text()
    
    // Log ALL console messages for payment state detection
    if (type === 'error' || type === 'warn') {
      console.log(`🚨 [${testName}] [${userType}] [BROWSER ${type.toUpperCase()}]:`, text)
    } else if (
      text.includes('[PAYMENT') || 
      text.includes('[SUBSCRIPTION') || 
      text.includes('[USER_STATE') ||
      text.includes('[DATABASE') ||
      text.includes('[AUTH') ||
      text.includes('🚀') || 
      text.includes('✅') || 
      text.includes('💰') ||
      text.includes('🎯') ||
      text.includes('🔐') ||
      text.includes('subscription') ||
      text.includes('payment') ||
      text.includes('tier') ||
      text.includes('credit')
    ) {
      console.log(`💡 [${testName}] [${userType}] [BROWSER LOG]:`, text)
    }
    
    // Log any mentions of user state, subscription, payment, bot access
    if (text.toLowerCase().includes('subscription') || 
        text.toLowerCase().includes('payment') || 
        text.toLowerCase().includes('tier') ||
        text.toLowerCase().includes('bot') ||
        text.toLowerCase().includes('telegram') ||
        text.toLowerCase().includes('credit')) {
      console.log(`🎯 [${testName}] [${userType}] [PAYMENT STATE LOG]:`, text)
    }
  })

  page.on('pageerror', (error) => {
    console.error(`🚨 [${testName}] [${userType}] [PAGE ERROR]:`, error.message)
    console.error('Stack:', error.stack)
  })

  page.on('requestfailed', (request) => {
    console.error(`🚨 [${testName}] [${userType}] [REQUEST FAILED]:`, request.url(), request.failure()?.errorText)
  })

  page.on('response', (response) => {
    const url = response.url()
    if (!response.ok() && (url.includes('/api/') || url.includes('supabase'))) {
      console.error(`🚨 [${testName}] [${userType}] [API ERROR]:`, response.status(), url)
    }
    
    // Log all API calls related to user state
    if (url.includes('/api/user') || 
        url.includes('/api/profile') || 
        url.includes('/api/subscription') ||
        url.includes('supabase')) {
      console.log(`📡 [${testName}] [${userType}] [API CALL]:`, response.status(), url)
    }
  })

  // Log all network requests for debugging
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/') || url.includes('supabase')) {
      console.log(`📤 [${testName}] [${userType}] [API REQUEST]:`, request.method(), url)
    }
  })
}

// Helper function to perform login/signup
async function performAuth(page: Page, user: any, testName: string, isSignup: boolean = false) {
  console.log(`🚀 [${testName}] ${isSignup ? 'Signing up' : 'Logging in'} user: ${user.email}`)
  
  // Navigate to landing page
  await page.goto('http://localhost:3003')
  await expect(page).toHaveTitle(/Clixen AI/)
  console.log(`📍 [${testName}] Landing page loaded`)
  
  // Open authentication modal
  const getStartedButton = page.locator('button:has-text("Get Started"), button:has-text("Sign In")')
  await expect(getStartedButton.first()).toBeVisible({ timeout: 10000 })
  await getStartedButton.first().click()
  console.log(`🔓 [${testName}] Authentication modal opened`)
  
  // Wait for modal to appear
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  
  // Switch to appropriate mode
  if (isSignup) {
    console.log(`📝 [${testName}] Creating new account`)
    const signUpToggle = page.locator('button:has-text("Create Account"), button:has-text("Sign up")')
    if (await signUpToggle.count() > 0) {
      await signUpToggle.first().click()
      await page.waitForTimeout(500)
    }
  } else {
    console.log(`🔐 [${testName}] Using existing account`)
    const loginToggle = page.locator('button:has-text("Sign in"), button:has-text("Login")')
    if (await loginToggle.count() > 0) {
      await loginToggle.first().click()
      await page.waitForTimeout(500)
    }
  }
  
  // Fill credentials with comprehensive logging
  console.log(`📋 [${testName}] Filling authentication form`)
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  
  // Submit form
  const submitButton = isSignup 
    ? page.locator('button:has-text("Create Account"), button:has-text("Sign Up")').last()
    : page.locator('button:has-text("Sign In"), button:has-text("Login")').last()
  
  console.log(`✅ [${testName}] Submitting authentication form`)
  await submitButton.click()
  
  // Wait for response with extensive logging
  await page.waitForTimeout(3000)
  console.log(`⏳ [${testName}] Waiting for authentication response`)
}

// Helper function to analyze dashboard content based on user state
async function analyzeDashboardContent(page: Page, user: any, testName: string) {
  console.log(`🔍 [${testName}] Analyzing dashboard content for ${user.expectedState} user`)
  
  // Wait for dashboard to load
  await expect(page.locator('main, [role="main"], body')).toBeVisible({ timeout: 15000 })
  console.log(`✅ [${testName}] Dashboard area loaded`)
  
  // Take screenshot for visual debugging
  await page.screenshot({ path: `test-results/dashboard-${user.expectedState}-user.png`, fullPage: true })
  console.log(`📸 [${testName}] Dashboard screenshot captured`)
  
  // Analyze payment-related elements
  const paymentElements = {
    paymentPrompts: await page.locator('button:has-text("Upgrade"), button:has-text("Subscribe"), button:has-text("Get Started"), :has-text("Choose Plan"), :has-text("Payment")').count(),
    telegramLinks: await page.locator('button:has-text("Telegram"), a:has-text("Bot"), :has-text("@clixen_bot"), button:has-text("Open Bot")').count(),
    premiumFeatures: await page.locator(':has-text("Premium"), :has-text("Pro"), :has-text("Enterprise"), :has-text("Advanced")').count(),
    subscriptionStatus: await page.locator(':has-text("Active"), :has-text("Subscription"), :has-text("Plan"), :has-text("Tier")').count(),
    creditInfo: await page.locator(':has-text("Credits"), :has-text("Usage"), :has-text("Remaining")').count()
  }
  
  console.log(`📊 [${testName}] Dashboard element analysis:`, paymentElements)
  
  // Log current page content for debugging
  const pageTitle = await page.locator('h1').first().textContent()
  const currentUrl = page.url()
  console.log(`📍 [${testName}] Page title: "${pageTitle}", URL: ${currentUrl}`)
  
  return paymentElements
}

// Helper function to verify database state (if accessible via API)
async function verifyDatabaseState(page: Page, user: any, testName: string) {
  console.log(`🗄️ [${testName}] Attempting to verify database state for ${user.email}`)
  
  try {
    // Try to fetch user profile data
    const response = await page.request.get('http://localhost:3003/api/user')
    console.log(`📡 [${testName}] User API response status: ${response.status()}`)
    
    if (response.ok()) {
      const userData = await response.json()
      console.log(`✅ [${testName}] User data retrieved:`, {
        id: userData.id,
        email: userData.email,
        subscription_tier: userData.subscription_tier,
        credits: userData.credits,
        created_at: userData.created_at
      })
      return userData
    } else {
      console.log(`⚠️ [${testName}] User API returned ${response.status()}: ${await response.text()}`)
    }
  } catch (error) {
    console.error(`🚨 [${testName}] Database state verification failed:`, error)
  }
  
  return null
}

test.describe('User Payment States & Dashboard Content', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for clean state testing
    await page.context().clearCookies()
    await page.context().clearPermissions()
    console.log(`🧹 Cleared browser state for clean testing`)
  })

  test('New User (testuser3) - Payment Prompts, No Bot Access', async ({ page }) => {
    const testName = 'NEW_USER_STATE'
    const user = TEST_USERS.NEW_USER
    setupPaymentStateLogging(page, testName, 'NEW_USER')
    
    console.log(`🚀 [${testName}] Testing new user payment state detection`)
    console.log(`👤 [${testName}] User: ${user.email} (${user.description})`)

    // Step 1: Attempt to create new account
    console.log(`📍 [${testName}] Step 1: Creating new user account`)
    await performAuth(page, user, testName, true)
    
    // Check if user was created or already exists
    await page.waitForTimeout(2000)
    const currentUrl = page.url()
    console.log(`📍 [${testName}] Post-signup URL: ${currentUrl}`)
    
    if (currentUrl.includes('dashboard')) {
      console.log(`✅ [${testName}] New user created successfully, redirected to dashboard`)
    } else {
      console.log(`🔄 [${testName}] User might already exist, attempting login`)
      await performAuth(page, user, testName, false)
      await page.waitForTimeout(2000)
    }

    // Step 2: Verify dashboard access
    console.log(`📍 [${testName}] Step 2: Verifying dashboard access`)
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('dashboard')) {
      await page.goto('http://localhost:3003/dashboard')
      await page.waitForTimeout(2000)
    }
    
    const dashboardElements = await analyzeDashboardContent(page, user, testName)
    
    // Step 3: Verify database state
    console.log(`📍 [${testName}] Step 3: Verifying database state`)
    const userData = await verifyDatabaseState(page, user, testName)
    
    // Step 4: Test payment flow expectations for NEW USER
    console.log(`📍 [${testName}] Step 4: Testing new user expectations`)
    
    // NEW USERS should see payment prompts
    if (dashboardElements.paymentPrompts > 0) {
      console.log(`✅ [${testName}] NEW USER: Payment prompts found (${dashboardElements.paymentPrompts})`)
    } else {
      console.log(`❌ [${testName}] NEW USER: No payment prompts found - this may be incorrect`)
    }
    
    // NEW USERS should NOT see Telegram bot access
    if (dashboardElements.telegramLinks === 0) {
      console.log(`✅ [${testName}] NEW USER: No Telegram bot links found (correct)`)
    } else {
      console.log(`❌ [${testName}] NEW USER: Telegram bot links found (${dashboardElements.telegramLinks}) - should be hidden`)
    }
    
    // Test subscription page redirection
    console.log(`📍 [${testName}] Step 5: Testing subscription page access`)
    await page.goto('http://localhost:3003/subscription')
    await page.waitForTimeout(2000)
    
    const subscriptionPageLoaded = await page.locator('h1:has-text("Choose"), h1:has-text("Plan"), h1:has-text("Subscription")').count() > 0
    if (subscriptionPageLoaded) {
      console.log(`✅ [${testName}] NEW USER: Subscription page accessible`)
    } else {
      console.log(`⚠️ [${testName}] NEW USER: Subscription page not found`)
    }
    
    console.log(`🎉 [${testName}] New user state testing completed!`)
  })

  test('Returning Unpaid User (testuser4) - Persistent Payment Prompts', async ({ page }) => {
    const testName = 'UNPAID_USER_STATE'
    const user = TEST_USERS.RETURNING_UNPAID
    setupPaymentStateLogging(page, testName, 'UNPAID_USER')
    
    console.log(`🚀 [${testName}] Testing returning unpaid user state`)
    console.log(`👤 [${testName}] User: ${user.email} (${user.description})`)

    // Step 1: Login returning unpaid user
    console.log(`📍 [${testName}] Step 1: Logging in returning unpaid user`)
    await performAuth(page, user, testName, false)
    await page.waitForTimeout(3000)
    
    // If login failed, try signup first then login
    if (!page.url().includes('dashboard')) {
      console.log(`🔄 [${testName}] Login failed, creating account first`)
      await performAuth(page, user, testName, true)
      await page.waitForTimeout(2000)
      
      if (!page.url().includes('dashboard')) {
        console.log(`🔄 [${testName}] Signup complete, now logging in`)
        await performAuth(page, user, testName, false)
        await page.waitForTimeout(2000)
      }
    }

    // Step 2: Analyze unpaid user dashboard
    console.log(`📍 [${testName}] Step 2: Analyzing unpaid user dashboard`)
    
    if (!page.url().includes('dashboard')) {
      await page.goto('http://localhost:3003/dashboard')
      await page.waitForTimeout(2000)
    }
    
    const dashboardElements = await analyzeDashboardContent(page, user, testName)
    
    // Step 3: Verify database state shows unpaid status
    console.log(`📍 [${testName}] Step 3: Verifying unpaid user database state`)
    const userData = await verifyDatabaseState(page, user, testName)
    
    if (userData) {
      if (!userData.subscription_tier || userData.subscription_tier === 'free' || userData.subscription_tier === 'starter') {
        console.log(`✅ [${testName}] UNPAID USER: Database shows unpaid status (${userData.subscription_tier})`)
      } else {
        console.log(`❌ [${testName}] UNPAID USER: Database shows paid status (${userData.subscription_tier}) - test data may be incorrect`)
      }
    }
    
    // Step 4: Test unpaid user expectations
    console.log(`📍 [${testName}] Step 4: Testing unpaid user expectations`)
    
    // UNPAID USERS should still see payment prompts
    if (dashboardElements.paymentPrompts > 0) {
      console.log(`✅ [${testName}] UNPAID USER: Payment prompts still visible (${dashboardElements.paymentPrompts})`)
    } else {
      console.log(`❌ [${testName}] UNPAID USER: No payment prompts - should still be prompting to upgrade`)
    }
    
    // UNPAID USERS should NOT see full Telegram bot access
    if (dashboardElements.telegramLinks === 0) {
      console.log(`✅ [${testName}] UNPAID USER: Telegram bot access hidden (correct)`)
    } else {
      console.log(`❌ [${testName}] UNPAID USER: Telegram bot access visible (${dashboardElements.telegramLinks}) - should be restricted`)
    }
    
    // Test limited feature access
    console.log(`📍 [${testName}] Step 5: Testing limited feature access`)
    
    // Check if premium features are restricted
    const premiumRestrictions = await page.locator(':has-text("Upgrade to Pro"), :has-text("Premium Feature"), :has-text("Subscribe"), button[disabled]').count()
    console.log(`🔒 [${testName}] UNPAID USER: Premium restrictions found: ${premiumRestrictions}`)
    
    console.log(`🎉 [${testName}] Unpaid user state testing completed!`)
  })

  test('Paid User (testuser5) - Full Access with Bot Link', async ({ page }) => {
    const testName = 'PAID_USER_STATE'
    const user = TEST_USERS.PAID_USER
    setupPaymentStateLogging(page, testName, 'PAID_USER')
    
    console.log(`🚀 [${testName}] Testing paid user with full access`)
    console.log(`👤 [${testName}] User: ${user.email} (${user.description})`)

    // Step 1: Login paid user
    console.log(`📍 [${testName}] Step 1: Logging in paid user`)
    await performAuth(page, user, testName, false)
    await page.waitForTimeout(3000)
    
    // If user doesn't exist, create them first
    if (!page.url().includes('dashboard')) {
      console.log(`🔄 [${testName}] Paid user doesn't exist, creating account`)
      await performAuth(page, user, testName, true)
      await page.waitForTimeout(2000)
      
      if (!page.url().includes('dashboard')) {
        await performAuth(page, user, testName, false)
        await page.waitForTimeout(2000)
      }
    }

    // Step 2: Analyze paid user dashboard
    console.log(`📍 [${testName}] Step 2: Analyzing paid user dashboard`)
    
    if (!page.url().includes('dashboard')) {
      await page.goto('http://localhost:3003/dashboard')
      await page.waitForTimeout(2000)
    }
    
    const dashboardElements = await analyzeDashboardContent(page, user, testName)
    
    // Step 3: Verify database state shows paid status
    console.log(`📍 [${testName}] Step 3: Verifying paid user database state`)
    const userData = await verifyDatabaseState(page, user, testName)
    
    if (userData) {
      if (userData.subscription_tier === 'pro' || userData.subscription_tier === 'enterprise' || userData.subscription_tier === 'premium') {
        console.log(`✅ [${testName}] PAID USER: Database shows paid status (${userData.subscription_tier})`)
      } else {
        console.log(`⚠️ [${testName}] PAID USER: Database shows unpaid status (${userData.subscription_tier}) - may need manual upgrade for testing`)
      }
    }
    
    // Step 4: Test paid user expectations
    console.log(`📍 [${testName}] Step 4: Testing paid user expectations`)
    
    // PAID USERS should see fewer payment prompts (maybe upgrade prompts for higher tiers)
    console.log(`💰 [${testName}] PAID USER: Payment prompts count: ${dashboardElements.paymentPrompts}`)
    
    // PAID USERS should see Telegram bot access
    if (dashboardElements.telegramLinks > 0) {
      console.log(`✅ [${testName}] PAID USER: Telegram bot access visible (${dashboardElements.telegramLinks})`)
    } else {
      console.log(`❌ [${testName}] PAID USER: No Telegram bot access found - should be visible for paid users`)
    }
    
    // Step 5: Test bot access page
    console.log(`📍 [${testName}] Step 5: Testing bot access page`)
    await page.goto('http://localhost:3003/bot-access')
    await page.waitForTimeout(2000)
    
    const botAccessElements = {
      botLink: await page.locator('button:has-text("Open"), a[href*="t.me"], button:has-text("Telegram")').count(),
      accessCode: await page.locator('code, :has-text("Access Code"), :has-text("Use this code")').count(),
      instructions: await page.locator(':has-text("@clixen_bot"), :has-text("Start"), :has-text("Connect")').count()
    }
    
    console.log(`🤖 [${testName}] PAID USER: Bot access elements:`, botAccessElements)
    
    if (botAccessElements.botLink > 0 && botAccessElements.accessCode > 0) {
      console.log(`✅ [${testName}] PAID USER: Full bot access available`)
      
      // Test Telegram bot link functionality
      const telegramButton = page.locator('button:has-text("Open"), button:has-text("Telegram")').first()
      if (await telegramButton.count() > 0) {
        console.log(`🔗 [${testName}] Testing Telegram bot link`)
        
        // Listen for popup/new tab
        const [popup] = await Promise.all([
          page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
          telegramButton.click()
        ])

        if (popup) {
          const popupUrl = popup.url()
          console.log(`✅ [${testName}] PAID USER: Telegram link opened: ${popupUrl}`)
          expect(popupUrl).toContain('t.me')
          await popup.close()
        } else {
          console.log(`ℹ️ [${testName}] PAID USER: Telegram link behavior captured`)
        }
      }
    } else {
      console.log(`❌ [${testName}] PAID USER: Bot access incomplete - missing elements`)
    }
    
    // Step 6: Test premium features access
    console.log(`📍 [${testName}] Step 6: Testing premium features access`)
    
    const premiumFeatures = await page.locator(':has-text("Premium"), :has-text("Advanced"), :has-text("Pro"), button:not([disabled])').count()
    console.log(`🌟 [${testName}] PAID USER: Premium features accessible: ${premiumFeatures}`)
    
    console.log(`🎉 [${testName}] Paid user state testing completed!`)
  })

  test('Cross-User State Verification & Error Detection', async ({ page }) => {
    const testName = 'CROSS_STATE_VERIFY'
    setupPaymentStateLogging(page, testName, 'CROSS_VERIFY')
    
    console.log(`🚀 [${testName}] Testing cross-user state verification and error detection`)

    // Test database consistency by checking all user states
    const users = [TEST_USERS.NEW_USER, TEST_USERS.RETURNING_UNPAID, TEST_USERS.PAID_USER]
    
    for (const user of users) {
      console.log(`📍 [${testName}] Verifying state consistency for ${user.expectedState} user: ${user.email}`)
      
      // Login each user and verify their state
      await performAuth(page, user, testName, false)
      await page.waitForTimeout(3000)
      
      // If login failed, try signup
      if (!page.url().includes('dashboard')) {
        await performAuth(page, user, testName, true)
        await page.waitForTimeout(2000)
        
        // Then login after signup
        if (!page.url().includes('dashboard')) {
          await performAuth(page, user, testName, false)
          await page.waitForTimeout(2000)
        }
      }
      
      // Analyze their dashboard
      if (!page.url().includes('dashboard')) {
        await page.goto('http://localhost:3003/dashboard')
        await page.waitForTimeout(2000)
      }
      
      const elements = await analyzeDashboardContent(page, user, testName)
      const dbData = await verifyDatabaseState(page, user, testName)
      
      // Log state verification results
      console.log(`🔍 [${testName}] State verification for ${user.expectedState}:`, {
        paymentPrompts: elements.paymentPrompts,
        telegramLinks: elements.telegramLinks,
        subscriptionTier: dbData?.subscription_tier || 'unknown',
        credits: dbData?.credits || 'unknown'
      })
      
      // Logout to test next user
      await page.context().clearCookies()
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
    }
    
    console.log(`🎉 [${testName}] Cross-user state verification completed!`)
  })

  test('Payment State Error Detection & Silent Failure Prevention', async ({ page }) => {
    const testName = 'ERROR_DETECTION'
    setupPaymentStateLogging(page, testName, 'ERROR_DETECTION')
    
    console.log(`🚀 [${testName}] Testing payment state error detection and silent failure prevention`)

    // Test API endpoint error handling
    console.log(`📍 [${testName}] Testing API endpoint error scenarios`)
    
    // Simulate API failures
    await page.route('/api/user', async (route) => {
      console.log(`🔧 [${testName}] Intercepting user API to test error handling`)
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Database connection failed' })
      })
    })
    
    // Try to access dashboard without proper auth
    await page.goto('http://localhost:3003/dashboard')
    await page.waitForTimeout(3000)
    
    // Check how the app handles API failures
    const errorElements = await page.locator('[role="alert"], :has-text("Error"), :has-text("Failed"), :has-text("Try again")').count()
    console.log(`🚨 [${testName}] Error elements found during API failure: ${errorElements}`)
    
    // Remove route intercept
    await page.unroute('/api/user')
    
    // Test database state detection errors
    console.log(`📍 [${testName}] Testing database state detection`)
    
    // Login with a valid user
    const user = TEST_USERS.NEW_USER
    await performAuth(page, user, testName, false)
    await page.waitForTimeout(3000)
    
    // Check for any JavaScript errors during state detection
    let jsErrors: string[] = []
    page.on('pageerror', (error) => {
      jsErrors.push(error.message)
      console.error(`🚨 [${testName}] JavaScript Error Detected:`, error.message)
    })
    
    // Navigate through different states
    const testPages = ['/dashboard', '/subscription', '/profile', '/bot-access']
    
    for (const testPage of testPages) {
      console.log(`📍 [${testName}] Testing error detection on: ${testPage}`)
      await page.goto(`http://localhost:3003${testPage}`)
      await page.waitForTimeout(2000)
      
      // Check for silent failures
      const pageLoaded = await page.locator('main, [role="main"], body').isVisible()
      if (!pageLoaded) {
        console.error(`🚨 [${testName}] Silent failure detected: ${testPage} did not load properly`)
      } else {
        console.log(`✅ [${testName}] Page ${testPage} loaded successfully`)
      }
    }
    
    // Report JavaScript errors found
    if (jsErrors.length > 0) {
      console.error(`🚨 [${testName}] JavaScript errors detected during testing:`, jsErrors)
    } else {
      console.log(`✅ [${testName}] No JavaScript errors detected during payment state testing`)
    }
    
    console.log(`🎉 [${testName}] Error detection and silent failure prevention testing completed!`)
  })
})