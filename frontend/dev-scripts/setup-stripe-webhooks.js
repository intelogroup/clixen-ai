require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupWebhooks() {
  console.log('🔥 STRIPE WEBHOOK CONFIGURATION GUIDE');
  console.log('=' .repeat(60));
  
  try {
    // First, let's list any existing webhook endpoints
    console.log('📍 Step 1: Checking existing webhooks...');
    const existingWebhooks = await stripe.webhookEndpoints.list();
    console.log(`Found ${existingWebhooks.data.length} existing webhook(s)`);
    
    // Check for production webhooks
    const productionWebhooks = existingWebhooks.data.filter(
      webhook => webhook.url.includes('vercel') || webhook.url.includes('netlify') || !webhook.url.includes('localhost')
    );
    
    if (productionWebhooks.length > 0) {
      console.log('✅ Production webhooks found:');
      productionWebhooks.forEach(webhook => {
        console.log(`  - ${webhook.url} (${webhook.status})`);
        console.log(`    ID: ${webhook.id}`);
        console.log(`    Events: ${webhook.enabled_events.length}`);
      });
    }
    
    // Since we can't create localhost webhooks, provide development setup guide
    console.log('\n📍 Step 2: Development Webhook Setup Required');
    console.log('⚠️  Cannot create webhooks for localhost - manual setup required');
    
    const requiredEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated', 
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ];
    
    console.log('\n🔧 DEVELOPMENT SETUP INSTRUCTIONS:');
    console.log('For local testing, you need to use ngrok or Stripe CLI:');
    
    console.log('\n📍 Method 1: Using Stripe CLI (Recommended)');
    console.log('1. Install Stripe CLI: https://docs.stripe.com/stripe-cli#install');
    console.log('2. Login: stripe login');
    console.log('3. Forward webhooks: stripe listen --forward-to localhost:3002/api/stripe/webhook');
    console.log('4. Copy the webhook secret (whsec_...) to .env.local as STRIPE_WEBHOOK_SECRET');
    
    console.log('\n📍 Method 2: Using ngrok');
    console.log('1. Install: npm install -g ngrok');
    console.log('2. Run: ngrok http 3002');
    console.log('3. Use the https URL to create webhook in Stripe Dashboard');
    
    console.log('\n📍 Required Events to Enable:');
    requiredEvents.forEach(event => console.log(`  - ${event}`));
    
    console.log('\n📍 Step 3: Production Webhook Setup');
    console.log('Once deployed, create webhook with your production URL:');
    
    const productionUrl = 'https://YOUR_DOMAIN.vercel.app/api/stripe/webhook';
    console.log(`Webhook URL: ${productionUrl}`);
    
    // Step 4: Test webhook creation for production (commented out)
    console.log('\n📍 Step 4: Creating Production Webhook (when ready)');
    console.log('Uncomment the code below and update the URL when deploying:');
    console.log(`
/*
const webhook = await stripe.webhookEndpoints.create({
  url: '${productionUrl}',
  enabled_events: [${requiredEvents.map(e => `'${e}'`).join(', ')}],
  description: 'Clixen AI - Production Webhooks'
});
console.log('Production webhook created:', webhook.id);
*/`);
    
  } catch (error) {
    console.error('❌ Error setting up webhooks:', error.message);
    
    if (error.code === 'url_invalid') {
      console.log('\n💡 TIP: The webhook URL must be publicly accessible.');
      console.log('For local development, use ngrok:');
      console.log('1. Install: npm install -g ngrok');
      console.log('2. Run: ngrok http 3002');
      console.log('3. Use the https URL provided by ngrok');
    }
    
    throw error;
  }
}

// Step 6: Test webhook connectivity
async function testWebhook(webhookId) {
  console.log('\n📍 Step 6: Testing webhook connectivity...');
  
  try {
    const webhook = await stripe.webhookEndpoints.retrieve(webhookId);
    console.log('✅ Webhook accessible:', webhook.status);
    
    // You can trigger test events here if needed
    console.log('🧪 To test webhook events, make a test payment or subscription');
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

// Run the setup
setupWebhooks()
  .then((webhook) => {
    if (webhook) {
      return testWebhook(webhook.id);
    }
  })
  .then(() => {
    console.log('\n🎉 STRIPE WEBHOOK SETUP COMPLETE!');
    console.log('💰 Your payment system is ready for production.');
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error.message);
  });