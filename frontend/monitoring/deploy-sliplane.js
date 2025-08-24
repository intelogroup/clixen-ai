#!/usr/bin/env node

/**
 * SlipLane Deployment Script for Clixen AI Monitoring Stack
 * Optimized for $9 server with resource constraints
 */

import https from 'https';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SlipLane Configuration
const SLIPLANE_API_TOKEN = 'api_ro_yp6yg7m0vtricaevlwy11xs4';
const SLIPLANE_ORG_ID = 'org_v8jir501u7mp';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your_openai_api_key_here';

// Deployment configuration for $9 server
const DEPLOYMENT_CONFIG = {
  name: 'clixen-monitoring-dev',
  image: 'clixen/monitoring-stack:dev',
  resources: {
    memory: '1G',      // Conservative for $9 server
    cpu: '0.5',        // Half CPU
    storage: '5G'      // 5GB for logs (30-day retention)
  },
  environment: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    RETENTION_DAYS: '30',
    N8N_BASE_URL: 'https://n8nio-n8n-7xzf6n.sliplane.app',
    N8N_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0',
    OPENAI_API_KEY: OPENAI_API_KEY
  }
};

// Helper function for API calls
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : require('http');
    
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLIPLANE_API_TOKEN}`,
        ...options.headers
      },
      method: options.method || 'GET'
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
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

// Build Docker image locally
async function buildDockerImage() {
  console.log('🔨 Building Docker image for monitoring stack...');
  
  return new Promise((resolve, reject) => {
    exec('docker build -f Dockerfile.monitoring -t clixen/monitoring-stack:dev .', 
      { cwd: __dirname }, 
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Docker build failed:', error.message);
          reject(error);
        } else {
          console.log('✅ Docker image built successfully');
          console.log(stdout);
          resolve();
        }
      }
    );
  });
}

// Create comprehensive monitoring Dockerfile
async function createMonitoringDockerfile() {
  console.log('📝 Creating monitoring Dockerfile...');
  
  const dockerfile = `# Multi-stage Dockerfile for Clixen AI Monitoring Stack
# Optimized for $9 SlipLane server

FROM node:22-alpine AS mcp-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY n8n-mcp-server.js ./

FROM grafana/loki:3.4.1 AS loki-base

FROM grafana/promtail:3.4.1 AS promtail-base

FROM grafana/grafana:11.4.0

# Install additional tools
USER root
RUN apk add --no-cache curl jq docker-cli

# Install Grafana plugins
RUN grafana-cli plugins install grafana-loki-datasource

# Copy Loki binary
COPY --from=loki-base /usr/bin/loki /usr/bin/loki

# Copy Promtail binary  
COPY --from=promtail-base /usr/bin/promtail /usr/bin/promtail

# Copy MCP server
COPY --from=mcp-builder /app /opt/mcp-server

# Copy configuration files
COPY config/ /etc/monitoring/
COPY supervisord.conf /etc/supervisord.conf

# Create directories
RUN mkdir -p /var/lib/loki /var/lib/promtail /var/log/monitoring \\
    && chown -R grafana:grafana /var/lib/loki /var/lib/promtail /var/log/monitoring

# Install supervisor for multi-process container
RUN apk add --no-cache supervisor

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health && curl -f http://localhost:3100/ready || exit 1

# Expose ports
EXPOSE 3000 3100 9080

# Use supervisor to run all services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
`;

  await fs.writeFile(path.join(__dirname, 'Dockerfile.monitoring'), dockerfile);
  console.log('✅ Monitoring Dockerfile created');
}

// Create supervisor configuration
async function createSupervisorConfig() {
  console.log('📝 Creating supervisor configuration...');
  
  const supervisorConfig = `[supervisord]
nodaemon=true
user=root
logfile=/var/log/monitoring/supervisord.log
pidfile=/var/run/supervisord.pid
loglevel=debug

[program:grafana]
command=/run.sh
user=grafana
autorestart=true
stdout_logfile=/var/log/monitoring/grafana.log
stderr_logfile=/var/log/monitoring/grafana-error.log
environment=GF_SECURITY_ADMIN_PASSWORD=clixen_dev_2025,GF_LOG_LEVEL=debug

[program:loki]
command=/usr/bin/loki -config.file=/etc/monitoring/loki-dev.yaml
user=grafana
autorestart=true
stdout_logfile=/var/log/monitoring/loki.log
stderr_logfile=/var/log/monitoring/loki-error.log

[program:promtail]
command=/usr/bin/promtail -config.file=/etc/monitoring/promtail-dev.yaml
user=grafana
autorestart=true
stdout_logfile=/var/log/monitoring/promtail.log
stderr_logfile=/var/log/monitoring/promtail-error.log

[program:mcp-server]
command=node /opt/mcp-server/n8n-mcp-server.js
directory=/opt/mcp-server
user=grafana
autorestart=true
stdout_logfile=/var/log/monitoring/mcp-server.log
stderr_logfile=/var/log/monitoring/mcp-server-error.log
environment=NODE_ENV=development,N8N_BASE_URL=https://n8nio-n8n-7xzf6n.sliplane.app
`;

  await fs.writeFile(path.join(__dirname, 'supervisord.conf'), supervisorConfig);
  console.log('✅ Supervisor configuration created');
}

// Test SlipLane API connectivity
async function testSlipLaneAPI() {
  console.log('🧪 Testing SlipLane API connectivity...');
  
  try {
    // Try different endpoints to find the correct one
    const endpoints = [
      'https://api.sliplane.io/v1/ping',
      'https://api.sliplane.app/v1/ping', 
      'https://ctrl.sliplane.app/v1/ping',
      'https://api.sliplane.io/health',
      'https://api.sliplane.app/health'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`  Testing: ${endpoint}`);
        const response = await makeRequest(endpoint);
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 200 || response.status === 404) {
          console.log(`✅ Found working endpoint: ${endpoint}`);
          return endpoint.replace('/ping', '').replace('/health', '');
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('⚠️  Could not find working SlipLane API endpoint');
    return null;
    
  } catch (error) {
    console.error('❌ SlipLane API test failed:', error.message);
    return null;
  }
}

// Deploy via Docker Compose (local development)
async function deployLocal() {
  console.log('🚀 Deploying monitoring stack locally...');
  
  return new Promise((resolve, reject) => {
    exec('docker-compose -f docker-compose.dev.yml up -d --build', 
      { cwd: __dirname }, 
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Local deployment failed:', error.message);
          console.error('stderr:', stderr);
          reject(error);
        } else {
          console.log('✅ Monitoring stack deployed locally');
          console.log(stdout);
          resolve();
        }
      }
    );
  });
}

// Create development scripts
async function createDevScripts() {
  console.log('📝 Creating development scripts...');
  
  // Start script
  const startScript = `#!/bin/bash
set -e

echo "🚀 Starting Clixen AI Monitoring Stack (Development)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed"
    exit 1
fi

# Build and start services
docker-compose -f docker-compose.dev.yml up -d --build

echo "✅ Monitoring stack started!"
echo ""
echo "📊 Access points:"
echo "  • Grafana: http://localhost:3000 (admin/clixen_dev_2025)"
echo "  • Loki: http://localhost:3100"
echo "  • Promtail: http://localhost:9080"
echo ""
echo "🔧 Commands:"
echo "  • View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "  • Stop: ./stop-monitoring.sh"
echo "  • Restart: ./restart-monitoring.sh"
`;

  // Stop script
  const stopScript = `#!/bin/bash
set -e

echo "🛑 Stopping Clixen AI Monitoring Stack"
docker-compose -f docker-compose.dev.yml down

echo "✅ Monitoring stack stopped"
`;

  // Restart script
  const restartScript = `#!/bin/bash
set -e

echo "🔄 Restarting Clixen AI Monitoring Stack"
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build

echo "✅ Monitoring stack restarted!"
`;

  // Test script
  const testScript = `#!/bin/bash
set -e

echo "🧪 Testing Clixen AI Monitoring Stack"

# Test MCP server
echo "Testing MCP server..."
cd ../
node monitoring/test-mcp-server.js

echo "✅ All tests passed!"
`;

  await fs.writeFile(path.join(__dirname, 'start-monitoring.sh'), startScript);
  await fs.writeFile(path.join(__dirname, 'stop-monitoring.sh'), stopScript);
  await fs.writeFile(path.join(__dirname, 'restart-monitoring.sh'), restartScript);
  await fs.writeFile(path.join(__dirname, 'test-monitoring.sh'), testScript);
  
  // Make scripts executable (on Unix systems)
  try {
    exec('chmod +x *.sh', { cwd: __dirname });
  } catch (error) {
    console.log('⚠️  Could not make scripts executable (Windows system)');
  }
  
  console.log('✅ Development scripts created');
}

// Main deployment function
async function deployMonitoring() {
  console.log('🚀 Starting Clixen AI Monitoring Stack Deployment\n');
  console.log('Configuration:');
  console.log(`  • Target: $9 SlipLane server`);
  console.log(`  • Memory limit: ${DEPLOYMENT_CONFIG.resources.memory}`);
  console.log(`  • CPU limit: ${DEPLOYMENT_CONFIG.resources.cpu}`);
  console.log(`  • Storage: ${DEPLOYMENT_CONFIG.resources.storage}`);
  console.log(`  • Retention: 30 days`);
  console.log(`  • Log level: Maximum detail\n`);
  
  try {
    // Step 1: Create configuration files
    await createMonitoringDockerfile();
    await createSupervisorConfig();
    await createDevScripts();
    
    // Step 2: Test SlipLane API (optional for now)
    const apiEndpoint = await testSlipLaneAPI();
    
    // Step 3: Build and deploy locally first
    await deployLocal();
    
    console.log('\n🎉 Deployment Complete!');
    console.log('='.repeat(50));
    console.log('✅ Monitoring stack is running locally');
    console.log('');
    console.log('📊 Access URLs:');
    console.log('  • Grafana Dashboard: http://localhost:3000');
    console.log('    Username: admin');
    console.log('    Password: clixen_dev_2025');
    console.log('  • Loki API: http://localhost:3100');
    console.log('  • Promtail Metrics: http://localhost:9080/metrics');
    console.log('');
    console.log('🔧 Management Commands:');
    console.log('  • View logs: docker-compose -f monitoring/docker-compose.dev.yml logs -f');
    console.log('  • Stop stack: cd monitoring && ./stop-monitoring.sh');
    console.log('  • Restart: cd monitoring && ./restart-monitoring.sh');
    console.log('  • Test MCP: cd monitoring && ./test-monitoring.sh');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('  1. Open Grafana at http://localhost:3000');
    console.log('  2. Explore logs in the Explore section');
    console.log('  3. Test MCP server with Claude Desktop');
    console.log('  4. Deploy to SlipLane when ready');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployMonitoring();
}

export { deployMonitoring };