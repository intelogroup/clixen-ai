#!/usr/bin/env node

/**
 * Simple SlipLane API Test
 */

import https from 'https';

const SLIPLANE_API_TOKEN = 'api_ro_yp6yg7m0vtricaevlwy11xs4';
const SLIPLANE_ORG_ID = 'org_v8jir501u7mp';

// Test different API endpoints
const endpoints = [
  'https://api.sliplane.io/health',
  'https://api.sliplane.app/health', 
  'https://ctrl.sliplane.io/health',
  'https://api.sliplane.io/v1/services',
  'https://api.sliplane.app/v1/services',
  'https://ctrl.sliplane.io/api/v1/services'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'Authorization': `Bearer ${SLIPLANE_API_TOKEN}`,
        'X-Organization-ID': SLIPLANE_ORG_ID,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        statusText: error.message,
        data: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        statusText: 'Request timeout',
        data: null
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing SlipLane API Endpoints\n');
  console.log(`Token: ${SLIPLANE_API_TOKEN.substring(0, 10)}...`);
  console.log(`Org ID: ${SLIPLANE_ORG_ID}\n`);

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    console.log(`  Status: ${result.status} ${result.statusText}`);
    if (result.data) {
      console.log(`  Data: ${result.data}...`);
    }
    console.log('');
  }

  console.log('✅ API tests completed');
}

runTests().catch(console.error);