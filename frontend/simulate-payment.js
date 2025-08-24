// This script simulates a successful Stripe payment by directly updating the user's tier in Supabase
// In production, this would happen via Stripe webhooks

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efashzkgbougijqcbead.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXNoemtnYm91Z2lqcWNiZWFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NTE1OSwiZXhwIjoyMDcxNDUxMTU5fQ.lJER_0s9dVyp1wJKC9PiPivSb4793DwcbeRC5dGEr4I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulatePayment(userEmail, plan = 'pro') {
  console.log('💳 SIMULATING STRIPE PAYMENT WEBHOOK');
  console.log('=' .repeat(50));
  console.log('User Email:', userEmail);
  console.log('Plan:', plan);
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Get the user by email
    console.log('\n📍 Step 1: Finding user...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    if (userError || !users) {
      console.error('❌ User not found:', userError);
      return;
    }
    
    console.log('✅ User found:', users.email);
    console.log('Current tier:', users.tier);
    console.log('Current credits:', users.credits_remaining);
    
    // Step 2: Update user to paid tier
    console.log('\n📍 Step 2: Upgrading user to', plan, 'tier...');
    
    const credits = plan === 'pro' ? 500 : plan === 'enterprise' ? 2000 : 100;
    
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        tier: plan,
        credits_remaining: credits,
        updated_at: new Date().toISOString()
      })
      .eq('id', users.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }
    
    console.log('✅ User upgraded successfully!');
    console.log('New tier:', updated.tier);
    console.log('New credits:', updated.credits_remaining);
    
    // Step 3: Create a usage_metrics entry to show the upgrade
    console.log('\n📍 Step 3: Recording payment in usage metrics...');
    
    const { error: metricsError } = await supabase
      .from('usage_metrics')
      .insert({
        user_id: users.id,
        service_type: 'subscription_upgrade',
        credits_consumed: 0,
        description: `Upgraded to ${plan} plan`,
        metadata: {
          plan: plan,
          credits_granted: credits,
          payment_method: 'simulated'
        }
      });
    
    if (metricsError) {
      console.log('⚠️ Metrics recording failed (non-critical):', metricsError.message);
    } else {
      console.log('✅ Payment recorded in usage metrics');
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 PAYMENT SIMULATION COMPLETE');
    console.log('=' .repeat(50));
    console.log('User:', userEmail);
    console.log('Status: PAID (' + plan + ')');
    console.log('Credits: ' + credits);
    console.log('\n✅ User can now access:');
    console.log('  - Dashboard with full features');
    console.log('  - Bot access page');
    console.log('  - Telegram bot @clixen_bot');
    console.log('  - All ' + plan + ' tier features');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get email from command line argument
const userEmail = process.argv[2];
const plan = process.argv[3] || 'pro';

if (!userEmail) {
  console.log('Usage: node simulate-payment.js <email> [plan]');
  console.log('Example: node simulate-payment.js testuser@example.com pro');
  console.log('Plans: starter, pro, enterprise');
} else {
  simulatePayment(userEmail, plan);
}