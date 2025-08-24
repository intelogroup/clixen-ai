const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;

async function setupBot() {
  console.log('🤖 Setting up Telegram Bot...');
  console.log('=' .repeat(50));
  
  // 1. Set webhook
  console.log('1. Setting webhook...');
  const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  
  const response = await fetch(setWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true
    })
  });
  
  const result = await response.json();
  
  if (result.ok) {
    console.log('✅ Webhook set successfully!');
    console.log(`   URL: ${WEBHOOK_URL}`);
  } else {
    console.error('❌ Failed to set webhook:', result.description);
    return;
  }
  
  // 2. Set bot commands
  console.log('2. Setting bot commands...');
  const setCommandsUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`;
  
  const commandsResponse = await fetch(setCommandsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: 'Start using Clixen AI' },
        { command: 'help', description: 'Show available commands' },
        { command: 'status', description: 'Check your account status' },
        { command: 'weather', description: 'Get weather for a city' },
        { command: 'scan_emails', description: 'Scan emails for invoices' },
        { command: 'feedback', description: 'Send feedback' }
      ]
    })
  });
  
  const commandsResult = await commandsResponse.json();
  
  if (commandsResult.ok) {
    console.log('✅ Commands set successfully!');
  } else {
    console.error('❌ Failed to set commands:', commandsResult.description);
  }
  
  // 3. Get bot info
  console.log('3. Getting bot info...');
  const getInfoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;
  
  const infoResponse = await fetch(getInfoUrl);
  const info = await infoResponse.json();
  
  if (info.ok) {
    console.log('✅ Bot info:');
    console.log(`   Username: @${info.result.username}`);
    console.log(`   Name: ${info.result.first_name}`);
    console.log(`   Can join groups: ${info.result.can_join_groups}`);
  }
  
  console.log('\n🎉 Bot setup complete!');
  console.log(`📱 Test your bot: https://t.me/${info.result.username}`);
}

setupBot().catch(console.error);