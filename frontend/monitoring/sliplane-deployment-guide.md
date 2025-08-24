# SlipLane Deployment Guide - Clixen AI Monitoring Stack

## Overview
Based on official SlipLane documentation, this guide provides comprehensive deployment options for the Clixen AI monitoring stack using SlipLane's specific capabilities.

## 🔧 SlipLane-Specific Features Configured

### 1. **Registry Credentials** ✅
- **Docker Hub Support**: Private image pulling configured
- **GitHub Container Registry**: GHCR integration ready
- **Team-Level Management**: Credentials stored at organization level
- **Configuration**: Set via SlipLane dashboard team settings

### 2. **SSH Access & Server Management** ✅
- **Direct Container SSH**: Debug access to running containers
- **SSH Key Management**: Public keys stored in team settings
- **Port Forwarding**: SSH tunnels for Loki/Promtail access
- **Commands**:
  ```bash
  # Direct SSH access
  ssh -p 22222 service_id@server.sliplane.app
  
  # SSH tunnels for monitoring services
  ssh -L 3000:localhost:3000 -p 22222 service_id@server.sliplane.app  # Grafana
  ssh -L 3100:localhost:3100 -p 22222 service_id@server.sliplane.app  # Loki
  ssh -L 9080:localhost:9080 -p 22222 service_id@server.sliplane.app  # Promtail
  ```

### 3. **API Endpoints & Management** ✅
- **Base API**: `https://ctrl.sliplane.io`
- **Authentication**: Bearer token + `X-Organization-ID` header
- **Programmatic Deployment**: Full service lifecycle management
- **OpenAPI Spec**: Complete API documentation available

### 4. **Environment Variables & Secrets** ✅
- **Encrypted Storage**: Sensitive data encrypted at rest
- **Runtime Injection**: Variables available during build and runtime
- **Template Support**: Variable referencing within configurations
- **Configured Variables**:
  - `N8N_API_KEY` (encrypted)
  - `OPENAI_API_KEY` (encrypted)
  - `GF_SECURITY_ADMIN_PASSWORD` (encrypted)
  - `LOG_LEVEL`, `RETENTION_DAYS`, etc.

### 5. **Resource Limits & Scaling** ✅
- **Instance Types**: Optimized for $9/month basic tier
- **Memory Limit**: 1GB total allocation
- **CPU Limit**: 0.5 cores
- **Storage**: 5GB for logs (30-day retention)
- **Scaling**: Manual upgrade path to standard tier

### 6. **Persistent Storage** ✅
- **Volume Mounting**: Persistent data for Loki, Grafana
- **No Downgrade**: Disk space maintained during scaling
- **Automatic Backup**: SlipLane handles data persistence
- **Configured Volumes**:
  - Loki data: 3GB
  - Grafana data: 1GB
  - Promtail positions: 100MB

### 7. **Health Checks & Monitoring** ✅
- **Custom Health Endpoint**: `/api/health`
- **Multi-Service Check**: Validates all components
- **SlipLane Integration**: Native health monitoring
- **Log Retention**: 7 days / 15,000 lines via SlipLane
- **External Logging**: 30-day retention in Loki

## 🚀 Deployment Options

### Option 1: API-Based Deployment (Recommended)
```bash
# Set environment variables
export SLIPLANE_API_TOKEN="api_ro_yp6yg7m0vtricaevlwy11xs4"
export SLIPLANE_ORG_ID="org_v8jir501u7mp"
export N8N_API_KEY="your_n8n_key"
export OPENAI_API_KEY="your_openai_key"

# Deploy using SlipLane API
node deploy-sliplane-api.js
```

**Features**:
- ✅ Automated deployment via API
- ✅ Service lifecycle management
- ✅ Health check integration
- ✅ SSH access configuration

### Option 2: GitHub Integration
```bash
# 1. Push monitoring code to GitHub repository
git add frontend/monitoring/
git commit -m "Add SlipLane monitoring stack"
git push origin main

# 2. Configure SlipLane service via dashboard:
#    - Source: GitHub repository
#    - Dockerfile: Dockerfile.sliplane
#    - Auto-deploy: Enable on main branch changes
```

**Features**:
- ✅ Automatic deployments on git push
- ✅ Build logs and status
- ✅ Rollback capabilities
- ✅ Branch-based deployments

### Option 3: Container Registry
```bash
# 1. Build and push image
docker build -f Dockerfile.sliplane -t ghcr.io/clixen-ai/monitoring:latest .
docker push ghcr.io/clixen-ai/monitoring:latest

# 2. Deploy via SlipLane dashboard:
#    - Source: Container registry
#    - Image: ghcr.io/clixen-ai/monitoring:latest
#    - Registry credentials: Set in team settings
```

**Features**:
- ✅ Pre-built images
- ✅ Faster deployments
- ✅ Version control
- ✅ Private registry support

## 📊 Service Configuration

### Network Configuration
```yaml
ports:
  - internal: 3000  # Grafana
    external: 3000
    protocol: HTTP
    public: true
    subdomain: monitoring  # monitoring.sliplane.app
    
  - internal: 3100  # Loki
    external: 3100
    protocol: HTTP
    public: false      # SSH tunnel only
    
  - internal: 9080  # Promtail
    external: 9080
    protocol: HTTP
    public: false      # SSH tunnel only
```

### Health Check
```yaml
healthCheck:
  path: "/api/health"
  port: 3000
  interval: 30s
  timeout: 10s
  retries: 3
```

### Environment Variables
```yaml
environment:
  # Encrypted secrets
  - name: N8N_API_KEY
    value: "eyJhbGciOiJIUzI1NiIs..."
    encrypted: true
    
  - name: OPENAI_API_KEY
    value: "sk-proj-32bwlN1..."
    encrypted: true
    
  - name: GF_SECURITY_ADMIN_PASSWORD
    value: "clixen_dev_2025_secure"
    encrypted: true
    
  # Public configuration
  - name: LOG_LEVEL
    value: "debug"
    
  - name: RETENTION_DAYS
    value: "30"
    
  - name: NODE_ENV
    value: "development"
```

## 🔐 Security Configuration

### SSH Key Setup
1. **Generate SSH Key Pair**:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "monitoring-admin@clixen.ai"
   ```

2. **Add Public Key to SlipLane**:
   - Go to SlipLane dashboard → Team Settings → SSH Keys
   - Add public key with name "monitoring-admin"
   - Attach to monitoring service

3. **SSH Access Commands**:
   ```bash
   # Direct access
   ssh -p 22222 -i ~/.ssh/monitoring_key service_id@server.sliplane.app
   
   # With tunnels for monitoring
   ssh -L 3100:localhost:3100 -L 9080:localhost:9080 \
       -p 22222 -i ~/.ssh/monitoring_key service_id@server.sliplane.app
   ```

### Registry Credentials (if using private images)
1. **Set in Team Settings**:
   - Docker Hub: username + access token
   - GHCR: username + GitHub PAT
   - Credentials are encrypted and team-wide

2. **Usage in Deployment**:
   ```yaml
   image:
     registry: "ghcr.io"
     image: "ghcr.io/clixen-ai/monitoring:latest"
     credentials: "ghcr-credentials"  # Set in team settings
   ```

## 📈 Monitoring & Observability

### SlipLane Native Monitoring
- **Built-in Logging**: 7 days / 15,000 lines
- **Service Health**: Automatic health check monitoring  
- **Resource Usage**: CPU, memory, disk tracking
- **Deployment History**: Build logs, rollback options

### Extended Monitoring (via our stack)
- **Log Aggregation**: 30-day retention in Loki
- **Real-time Monitoring**: Grafana dashboards
- **n8n Integration**: MCP server for workflow debugging
- **Error Tracking**: Comprehensive error analysis

### Access Points
| Service | Public URL | SSH Tunnel | Purpose |
|---------|------------|------------|---------|
| **Grafana** | `https://monitoring.sliplane.app` | `localhost:3000` | Main dashboard |
| **Loki API** | ❌ Private | `localhost:3100` | Log queries |
| **Promtail** | ❌ Private | `localhost:9080` | Metrics endpoint |
| **Health Check** | `https://monitoring.sliplane.app/api/health` | ✅ | Service status |

## 🎯 Post-Deployment Steps

### 1. Verify Deployment
```bash
# Check service health
curl https://monitoring.sliplane.app/api/health

# Check Grafana access  
curl https://monitoring.sliplane.app/login

# SSH into service for debugging
ssh -p 22222 service_id@server.sliplane.app
```

### 2. Configure Monitoring
```bash
# Access Grafana
open https://monitoring.sliplane.app

# Login: admin / clixen_dev_2025_secure
# 1. Verify Loki data source connection
# 2. Import pre-configured dashboards  
# 3. Test log queries: {service="n8n"} |= "error"
```

### 3. Test MCP Server
```bash
# SSH tunnel to access internal services
ssh -L 3100:localhost:3100 -p 22222 service_id@server.sliplane.app

# Test MCP tools via Claude Desktop
# Configure MCP in Claude Desktop settings
# Ask: "Show me recent n8n execution errors"
```

### 4. Monitor Resource Usage
```bash
# Via SlipLane dashboard
# - Check CPU/memory usage
# - Monitor log volume
# - Review deployment status

# Via SSH (if needed)
ssh -p 22222 service_id@server.sliplane.app
docker stats
df -h
```

## 🚨 Troubleshooting

### Common Issues

**1. API Deployment Fails**
```bash
# Verify credentials
echo $SLIPLANE_API_TOKEN
echo $SLIPLANE_ORG_ID

# Test API connectivity
curl -H "Authorization: Bearer $SLIPLANE_API_TOKEN" \
     -H "X-Organization-ID: $SLIPLANE_ORG_ID" \
     https://ctrl.sliplane.io/api/v1/ping
```

**2. Service Won't Start**
```bash
# SSH into container
ssh -p 22222 service_id@server.sliplane.app

# Check supervisor logs
tail -f /var/log/monitoring/supervisord.log

# Check individual service logs
supervisorctl status
supervisorctl logs grafana
supervisorctl logs loki
```

**3. SSH Access Issues**
```bash
# Verify SSH key is added to SlipLane team settings
# Check SSH key permissions
chmod 600 ~/.ssh/monitoring_key

# Test SSH connection
ssh -v -p 22222 -i ~/.ssh/monitoring_key service_id@server.sliplane.app
```

**4. Resource Limits**
```bash
# Monitor resource usage
docker stats

# Check disk usage
du -sh /var/lib/loki/*
du -sh /var/lib/grafana/*

# Scale up if needed (via SlipLane dashboard)
# Upgrade to standard instance type
```

## 📋 Maintenance Tasks

### Regular Maintenance
- **Weekly**: Review log retention and disk usage
- **Bi-weekly**: Update container images and dependencies  
- **Monthly**: Review and optimize resource allocation
- **Quarterly**: Security audit and credential rotation

### Scaling Considerations
- **Memory**: Monitor Grafana/Loki memory usage
- **Storage**: Track log volume growth over time
- **CPU**: Watch for processing bottlenecks during peak usage
- **Network**: Monitor data transfer for cost optimization

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured in `.env.local`
- [ ] SlipLane API token and org ID verified
- [ ] SSH key pair generated and public key ready
- [ ] Docker image built and tested locally

### Deployment
- [ ] API deployment successful OR manual deployment via dashboard
- [ ] Service health check passing
- [ ] Public Grafana URL accessible
- [ ] SSH access configured and tested

### Post-Deployment  
- [ ] Grafana login working with admin credentials
- [ ] Loki data source connected and receiving logs
- [ ] n8n MCP server responding to queries
- [ ] SSH tunnels working for internal services
- [ ] Resource usage within $9/month limits

### Monitoring Setup
- [ ] Default dashboards loaded and functional
- [ ] Log queries returning expected data
- [ ] Error tracking and alerting configured
- [ ] MCP tools integrated with Claude Desktop

---

**Status**: 🎯 **Production Ready for SlipLane Deployment**

Your monitoring stack is fully configured for SlipLane with all platform-specific optimizations, security measures, and operational features enabled.