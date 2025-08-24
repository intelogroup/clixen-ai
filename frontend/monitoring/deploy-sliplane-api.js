#!/usr/bin/env node

/**
 * SlipLane API Deployment Script for Clixen AI Monitoring Stack
 * Uses SlipLane's official API endpoints from documentation
 */

import https from 'https';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SlipLane API Configuration (from documentation)
const SLIPLANE_API_BASE = 'https://ctrl.sliplane.io';
const SLIPLANE_API_TOKEN = process.env.SLIPLANE_API_TOKEN || 'api_ro_yp6yg7m0vtricaevlwy11xs4';
const SLIPLANE_ORG_ID = process.env.SLIPLANE_ORG_ID || 'org_v8jir501u7mp';

// Service Configuration
const SERVICE_CONFIG = {
  name: 'clixen-monitoring-dev',
  description: 'Clixen AI Development Monitoring Stack - Grafana, Loki, Promtail, n8n MCP',
  image: {
    source: 'github',
    repository: 'clixen-ai/monitoring-stack',
    dockerfile: 'Dockerfile.sliplane'
  },
  environment: [
    { name: 'N8N_API_KEY', value: process.env.N8N_API_KEY, encrypted: true },
    { name: 'N8N_BASE_URL', value: 'https://n8nio-n8n-7xzf6n.sliplane.app' },
    { name: 'N8N_WEBHOOK_BASE_URL', value: 'https://n8nio-n8n-7xzf6n.sliplane.app/webhook' },
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY, encrypted: true },
    { name: 'GF_SECURITY_ADMIN_PASSWORD', value: 'clixen_dev_2025_secure', encrypted: true },
    { name: 'GF_LOG_LEVEL', value: 'debug' },
    { name: 'LOG_LEVEL', value: 'debug' },
    { name: 'RETENTION_DAYS', value: '30' },
    { name: 'NODE_ENV', value: 'development' }
  ],
  ports: [
    { internal: 3000, external: 3000, protocol: 'HTTP', public: true },
    { internal: 3100, external: 3100, protocol: 'HTTP', public: false },
    { internal: 9080, external: 9080, protocol: 'HTTP', public: false }
  ],
  healthCheck: {
    path: '/api/health',
    port: 3000,
    interval: 30
  },
  resources: {
    memory: '1Gi',
    cpu: '0.5'
  }
};

// HTTP client for SlipLane API
async function slipLaneRequest(endpoint, options = {}) {
  const url = `${SLIPLANE_API_BASE}${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${SLIPLANE_API_TOKEN}`,
        'X-Organization-ID': SLIPLANE_ORG_ID,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: parsed,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: null,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test SlipLane API connectivity
async function testSlipLaneAPI() {
  console.log('🧪 Testing SlipLane API connectivity...\n');
  
  try {
    // Try different endpoints based on documentation
    const endpoints = [
      '/api/v1/ping',
      '/api/v1/health', 
      '/api/v1/services',
      '/api/v1/organizations',
      '/health',
      '/ping'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`  Testing: ${SLIPLANE_API_BASE}${endpoint}`);
        const response = await slipLaneRequest(endpoint);
        console.log(`  Status: ${response.status} ${response.statusText}`);
        
        if (response.status >= 200 && response.status < 400) {
          console.log(`✅ Found working API endpoint: ${endpoint}`);
          console.log(`📝 Response:`, response.data || response.raw);
          return { success: true, endpoint, response };
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('⚠️  No working endpoints found. API may be different from documentation.');
    return { success: false, error: 'No working endpoints found' };
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// List existing services
async function listServices() {
  console.log('📋 Listing existing services...\n');
  
  try {
    const response = await slipLaneRequest('/api/v1/services');
    
    if (response.status === 200 && response.data) {
      console.log(`✅ Found ${response.data.length || 0} existing services:`);
      
      if (response.data.length > 0) {
        response.data.forEach((service, i) => {
          console.log(`  ${i + 1}. ${service.name || service.id} - ${service.status || 'unknown'}`);
        });
      } else {
        console.log('  No services found');
      }
      
      return { success: true, services: response.data };
    } else {
      console.log(`⚠️  API returned: ${response.status} ${response.statusText}`);
      console.log(`📝 Response:`, response.raw);
      return { success: false, error: `API returned ${response.status}` };
    }
    
  } catch (error) {
    console.error('❌ Failed to list services:', error.message);
    return { success: false, error: error.message };
  }
}

// Create or update monitoring service
async function deployMonitoringService() {
  console.log('🚀 Deploying monitoring service to SlipLane...\n');
  
  try {
    // Check if service already exists
    const existingServices = await listServices();
    const existingService = existingServices.services?.find(s => 
      s.name === SERVICE_CONFIG.name || s.name?.includes('monitoring')
    );
    
    if (existingService) {
      console.log(`📝 Found existing service: ${existingService.name}`);
      console.log('🔄 Updating existing service...');
      
      const response = await slipLaneRequest(`/api/v1/services/${existingService.id}`, {
        method: 'PUT',
        body: SERVICE_CONFIG
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Service updated successfully!');
        return { success: true, serviceId: existingService.id, action: 'updated' };
      } else {
        console.log('❌ Service update failed:', response.statusText);
        console.log('📝 Response:', response.raw);
        return { success: false, error: response.statusText };
      }
      
    } else {
      console.log('🆕 Creating new monitoring service...');
      
      const response = await slipLaneRequest('/api/v1/services', {
        method: 'POST',
        body: SERVICE_CONFIG
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Service created successfully!');
        return { 
          success: true, 
          serviceId: response.data?.id || 'unknown', 
          action: 'created' 
        };
      } else {
        console.log('❌ Service creation failed:', response.statusText);
        console.log('📝 Response:', response.raw);
        return { success: false, error: response.statusText };
      }
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Get service status and information
async function getServiceInfo(serviceId) {
  console.log(`📊 Getting service information for ${serviceId}...\n`);
  
  try {
    const response = await slipLaneRequest(`/api/v1/services/${serviceId}`);
    
    if (response.status === 200 && response.data) {
      const service = response.data;
      
      console.log('📋 Service Information:');
      console.log(`  Name: ${service.name}`);
      console.log(`  Status: ${service.status}`);
      console.log(`  URL: ${service.url || 'Not available'}`);
      console.log(`  Created: ${service.createdAt || 'Unknown'}`);
      
      if (service.ports) {
        console.log('  Ports:');
        service.ports.forEach(port => {
          console.log(`    ${port.internal}:${port.external} (${port.protocol})`);
        });
      }
      
      return { success: true, service };
    } else {
      console.log(`⚠️  Could not get service info: ${response.status}`);
      return { success: false, error: `API returned ${response.status}` };
    }
    
  } catch (error) {
    console.error('❌ Failed to get service info:', error.message);
    return { success: false, error: error.message };
  }
}

// Generate SSH access information
async function generateSSHInfo(serviceId) {
  console.log('🔐 Generating SSH access information...\n');
  
  // Note: SSH access details may need to be retrieved from service info
  console.log('📝 SSH Access (based on SlipLane documentation):');
  console.log(`  Command: ssh -p 22222 ${serviceId}@server.sliplane.app`);
  console.log('  Note: Exact SSH details depend on SlipLane service deployment');
  console.log('  Tunneling: ssh -L 3100:localhost:3100 -p 22222 ${serviceId}@server.sliplane.app');
  
  return {
    sshCommand: `ssh -p 22222 ${serviceId}@server.sliplane.app`,
    tunnelCommands: [
      `ssh -L 3000:localhost:3000 -p 22222 ${serviceId}@server.sliplane.app  # Grafana`,
      `ssh -L 3100:localhost:3100 -p 22222 ${serviceId}@server.sliplane.app  # Loki`,
      `ssh -L 9080:localhost:9080 -p 22222 ${serviceId}@server.sliplane.app  # Promtail`
    ]
  };
}

// Main deployment function
async function main() {
  console.log('🚀 SlipLane API Deployment for Clixen AI Monitoring Stack\n');
  console.log('Configuration:');
  console.log(`  API Base: ${SLIPLANE_API_BASE}`);
  console.log(`  Organization: ${SLIPLANE_ORG_ID}`);
  console.log(`  Service: ${SERVICE_CONFIG.name}`);
  console.log(`  Token: ${SLIPLANE_API_TOKEN ? 'SET' : 'MISSING'}\n`);
  
  try {
    // Step 1: Test API connectivity
    const apiTest = await testSlipLaneAPI();
    
    if (!apiTest.success) {
      console.log('\n⚠️  API connectivity issues detected.');
      console.log('📋 Possible solutions:');
      console.log('  1. Verify API token and organization ID');
      console.log('  2. Check if API endpoint has changed');
      console.log('  3. Try manual deployment via SlipLane dashboard');
      console.log('\n🔄 Continuing with local deployment...');
      
      // Fall back to local deployment
      return await deployLocal();
    }
    
    // Step 2: List existing services
    const serviceList = await listServices();
    
    // Step 3: Deploy monitoring service
    const deployResult = await deployMonitoringService();
    
    if (deployResult.success) {
      console.log(`\n🎉 Deployment ${deployResult.action} successfully!`);
      console.log('='.repeat(60));
      
      // Step 4: Get service information
      if (deployResult.serviceId !== 'unknown') {
        await getServiceInfo(deployResult.serviceId);
        
        // Step 5: Generate SSH access info
        const sshInfo = await generateSSHInfo(deployResult.serviceId);
        
        console.log('\n🔐 SSH Access Commands:');
        console.log(`  Direct: ${sshInfo.sshCommand}`);
        console.log('\n🌐 SSH Tunnels:');
        sshInfo.tunnelCommands.forEach(cmd => console.log(`  ${cmd}`));
      }
      
      console.log('\n📊 Access URLs:');
      console.log('  • Grafana: https://clixen-monitoring.sliplane.app');
      console.log('  • Loki API: Internal only (use SSH tunnel)');
      console.log('  • Health Check: https://clixen-monitoring.sliplane.app/api/health');
      
      console.log('\n🎯 Next Steps:');
      console.log('  1. Wait for deployment to complete (2-5 minutes)');
      console.log('  2. Access Grafana dashboard');
      console.log('  3. Test MCP server functionality');
      console.log('  4. Monitor logs via SlipLane dashboard');
      
      return { success: true };
      
    } else {
      throw new Error(`Deployment failed: ${deployResult.error}`);
    }
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    
    console.log('\n🔄 Fallback Options:');
    console.log('  1. Manual deployment via SlipLane dashboard');
    console.log('  2. Local development: docker-compose -f docker-compose.dev.yml up -d');
    console.log('  3. Alternative deployment: node deploy-sliplane.js');
    
    return { success: false, error: error.message };
  }
}

// Local deployment fallback
async function deployLocal() {
  console.log('\n🏠 Deploying locally as fallback...');
  
  return new Promise((resolve, reject) => {
    exec('docker-compose -f docker-compose.dev.yml up -d --build', 
      { cwd: __dirname }, 
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Local deployment failed:', error.message);
          resolve({ success: false, error: error.message });
        } else {
          console.log('✅ Local deployment successful!');
          console.log('\n📊 Local Access URLs:');
          console.log('  • Grafana: http://localhost:3000');
          console.log('  • Loki API: http://localhost:3100');
          console.log('  • Promtail: http://localhost:9080');
          resolve({ success: true, local: true });
        }
      }
    );
  });
}

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(result => process.exit(result.success ? 0 : 1))
    .catch(error => {
      console.error('Deployment error:', error);
      process.exit(1);
    });
}

export { main as deployToSlipLane };