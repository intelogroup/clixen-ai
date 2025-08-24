# Clixen AI - Comprehensive Monitoring & Logging Architecture

## Overview
This document outlines a comprehensive monitoring solution for Clixen AI using SQLite + Prisma MCP for n8n database access and Grafana/Loki for observability on SlipLane Alpine Docker infrastructure.

## Architecture Components

### 1. Data Sources
- **n8n SQLite Database**: Execution logs, workflow data, error tracking
- **Supabase PostgreSQL**: User profiles, usage logs, payment events
- **Application Logs**: Telegram bot, Next.js frontend, API endpoints
- **System Metrics**: Container performance, resource usage

### 2. Data Access Layer
- **Prisma MCP Server**: Direct SQLite database access for n8n CE
- **Supabase Client**: Real-time data from user database
- **Log Aggregation**: Container logs via Docker logging drivers

### 3. Monitoring Stack
- **Grafana**: Dashboards and visualization
- **Loki**: Log aggregation and querying
- **Promtail**: Log collection agent
- **Node Exporter**: System metrics (optional)

## Implementation Plan

### Phase 1: Prisma MCP Integration for n8n Database Access

#### 1.1 n8n SQLite Schema Analysis
Based on n8n CE documentation, the SQLite database contains these key tables:
- `execution_entity`: Workflow execution records
- `workflow_entity`: Workflow definitions
- `credentials_entity`: Stored credentials
- `variables_entity`: Environment variables
- `settings`: Application settings

#### 1.2 Prisma Schema Design
```prisma
// File: monitoring/prisma/n8n-schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "./client"
}

datasource db {
  provider = "sqlite"
  url      = env("N8N_DATABASE_URL")
}

model ExecutionEntity {
  id               String   @id
  finished         Boolean  @default(false)
  mode             String
  retryOf          String?
  retrySuccessId   String?
  startedAt        DateTime
  stoppedAt        DateTime?
  workflowData     String   // JSON
  workflowId       String
  status           String   // success, error, running, etc.
  data             String   // JSON execution data
  
  @@map("execution_entity")
}

model WorkflowEntity {
  id          String   @id
  name        String
  active      Boolean  @default(false)
  nodes       String   // JSON
  connections String   // JSON
  settings    String?  // JSON
  staticData  String?  // JSON
  createdAt   DateTime
  updatedAt   DateTime
  
  @@map("workflow_entity")
}

model VariablesEntity {
  id    String @id
  key   String @unique
  type  String
  value String
  
  @@map("variables_entity")
}
```

#### 1.3 MCP Server Implementation
```typescript
// File: monitoring/mcp-server/n8n-db-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PrismaClient } from './prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.N8N_DATABASE_URL || 'file:./n8n-database.sqlite'
    }
  }
});

const server = new Server(
  { name: 'n8n-db-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tool: Get Recent Executions
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'get_recent_executions') {
    const { limit = 10, status, workflowId } = request.params.arguments;
    
    const executions = await prisma.executionEntity.findMany({
      take: limit,
      where: {
        ...(status && { status }),
        ...(workflowId && { workflowId })
      },
      orderBy: { startedAt: 'desc' }
    });
    
    return { content: [{ type: 'text', text: JSON.stringify(executions, null, 2) }] };
  }
  
  if (request.params.name === 'get_execution_errors') {
    const errors = await prisma.executionEntity.findMany({
      where: { status: 'error' },
      take: 50,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        workflowId: true,
        startedAt: true,
        stoppedAt: true,
        data: true
      }
    });
    
    return { content: [{ type: 'text', text: JSON.stringify(errors, null, 2) }] };
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### Phase 2: SlipLane Alpine Docker Monitoring Stack

#### 2.1 Docker Compose Configuration
```yaml
# File: monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  loki:
    image: grafana/loki:3.4.1
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./loki-data:/loki
      - ./config/loki-config.yaml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped
    user: "10001:10001"  # SlipLane Alpine compatibility

  promtail:
    image: grafana/promtail:3.4.1
    container_name: promtail
    volumes:
      - ./config/promtail-config.yaml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:11.4.0
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./config/grafana-datasources.yaml:/etc/grafana/provisioning/datasources/datasources.yaml
      - ./config/grafana-dashboards.yaml:/etc/grafana/provisioning/dashboards/dashboards.yaml
      - ./dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=clixen_monitoring_2025
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    restart: unless-stopped
    depends_on:
      - loki

volumes:
  grafana-storage:
```

#### 2.2 Loki Configuration
```yaml
# File: monitoring/config/loki-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

query_scheduler:
  max_outstanding_requests_per_tenant: 2048

schema_config:
  configs:
    - from: 2020-10-24
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

analytics:
  reporting_enabled: false

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  max_cache_freshness_per_query: 10m
  split_queries_by_interval: 15m
  per_stream_rate_limit: 512M
  per_stream_rate_limit_burst: 1024M
  ingestion_rate_mb: 64
  ingestion_burst_size_mb: 128
  max_concurrent_tail_requests: 20
  max_query_parallelism: 32
```

#### 2.3 Promtail Configuration
```yaml
# File: monitoring/config/promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Docker container logs
  - job_name: containers
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'stream'
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: 'service'

  # n8n specific logs
  - job_name: n8n
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '.*(n8n).*'
        target_label: 'service'
        replacement: 'n8n'
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            timestamp: timestamp
      - labels:
          level:
          service: n8n

  # Clixen frontend logs
  - job_name: clixen-frontend
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '.*(clixen|frontend).*'
        target_label: 'service'
        replacement: 'clixen-frontend'
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(?P<level>\w+)\s+(?P<message>.*)'
      - labels:
          level:
          service: clixen-frontend
```

### Phase 3: Grafana Dashboards

#### 3.1 n8n Workflow Monitoring Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "n8n Workflow Monitoring",
    "tags": ["n8n", "workflows"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Workflow Execution Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(n8n_executions_total[5m]))",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps"
          }
        }
      },
      {
        "id": 2,
        "title": "Failed Executions",
        "type": "logs",
        "targets": [
          {
            "expr": "{service=\"n8n\"} |= \"error\" | json",
            "refId": "A"
          }
        ]
      },
      {
        "id": 3,
        "title": "Execution Duration",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, n8n_execution_duration_seconds_bucket)",
            "refId": "A"
          }
        ]
      }
    ]
  }
}
```

#### 3.2 Telegram Bot Monitoring Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Telegram Bot Analytics",
    "tags": ["telegram", "bot"],
    "panels": [
      {
        "id": 1,
        "title": "Message Volume",
        "type": "timeseries",
        "targets": [
          {
            "expr": "{service=\"clixen-frontend\"} |= \"telegram\" | json",
            "refId": "A"
          }
        ]
      },
      {
        "id": 2,
        "title": "Bot Response Time",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(telegram_response_duration_ms)",
            "refId": "A"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "{service=\"clixen-frontend\"} |= \"error\" |= \"telegram\"",
            "refId": "A"
          }
        ]
      }
    ]
  }
}
```

### Phase 4: SlipLane Deployment Strategy

#### 4.1 Dockerfile for Monitoring Stack
```dockerfile
# File: monitoring/Dockerfile
FROM node:22-alpine AS mcp-builder

WORKDIR /app
COPY monitoring/mcp-server/package*.json ./
RUN npm ci --only=production

COPY monitoring/mcp-server/ ./
RUN npx prisma generate

# Production monitoring image
FROM grafana/grafana:11.4.0

# Install additional plugins
RUN grafana-cli plugins install grafana-loki-datasource

# Copy custom configuration
COPY monitoring/config/grafana-datasources.yaml /etc/grafana/provisioning/datasources/
COPY monitoring/config/grafana-dashboards.yaml /etc/grafana/provisioning/dashboards/
COPY monitoring/dashboards/ /var/lib/grafana/dashboards/

# Copy MCP server
COPY --from=mcp-builder /app /opt/mcp-server

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000
```

#### 4.2 SlipLane Deployment Script
```bash
#!/bin/bash
# File: monitoring/deploy-to-sliplane.sh

set -e

echo "🚀 Deploying Monitoring Stack to SlipLane..."

# Build and push Docker image
docker build -t clixen-monitoring:latest monitoring/
docker tag clixen-monitoring:latest registry.sliplane.app/clixen-monitoring:latest
docker push registry.sliplane.app/clixen-monitoring:latest

# Deploy using SlipLane API
curl -X POST "https://api.sliplane.app/v1/services" \
  -H "Authorization: Bearer ${SLIPLANE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "clixen-monitoring",
    "image": "registry.sliplane.app/clixen-monitoring:latest",
    "ports": [{"internal": 3000, "external": 3000}],
    "env": [
      {"key": "N8N_DATABASE_URL", "value": "'"${N8N_DATABASE_URL}"'"},
      {"key": "GF_SECURITY_ADMIN_PASSWORD", "value": "'"${GRAFANA_PASSWORD}"'"}
    ],
    "volumes": [
      {"host": "/var/log", "container": "/var/log", "readonly": true},
      {"host": "/var/lib/docker/containers", "container": "/var/lib/docker/containers", "readonly": true}
    ]
  }'

echo "✅ Monitoring stack deployed successfully!"
echo "🌐 Access Grafana at: https://clixen-monitoring.sliplane.app"
```

## Key Questions & Decisions Needed

### 1. Database Access Strategy
**Question**: How do you want to access the n8n SQLite database from outside the container?
- **Option A**: Mount database file as volume (simpler, requires filesystem access)
- **Option B**: Database export/sync mechanism (more robust, works across networks)
- **Option C**: Custom n8n webhook endpoints for monitoring data

### 2. Log Collection Scope
**Question**: What level of logging detail do you need?
- **Minimal**: Errors and critical events only
- **Standard**: Execution logs, API calls, user actions
- **Verbose**: Debug logs, performance metrics, full request traces

### 3. Alert Configuration
**Question**: What events should trigger immediate alerts?
- Workflow execution failures
- High error rates (threshold?)
- System resource exhaustion
- User payment failures
- API rate limit hits

### 4. Data Retention Policy
**Question**: How long should monitoring data be kept?
- **Logs**: 30 days? 90 days?
- **Metrics**: 6 months? 1 year?
- **Error traces**: Until resolved + 30 days?

### 5. SlipLane Resource Allocation
**Question**: What's your budget for monitoring infrastructure?
- **Basic**: Single container, shared resources
- **Standard**: Dedicated monitoring server
- **Premium**: High-availability setup with redundancy

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Prisma MCP server for n8n database access
- [ ] Test database connection and schema validation
- [ ] Create basic monitoring dashboard

### Week 2: Log Aggregation
- [ ] Deploy Loki/Promtail stack on SlipLane
- [ ] Configure log collection from n8n and frontend
- [ ] Set up basic alerting rules

### Week 3: Dashboards & Visualization
- [ ] Create comprehensive Grafana dashboards
- [ ] Implement custom metrics collection
- [ ] Test end-to-end monitoring workflow

### Week 4: Production Hardening
- [ ] Configure alerts and notifications
- [ ] Set up automated backups
- [ ] Performance optimization and tuning

Would you like me to proceed with implementing any specific phase, or do you have questions about the proposed architecture?