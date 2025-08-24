# Complete Sliplane n8n Configuration Guide

## 🔍 **Server Information Analysis**
- **Public Domain:** `n8nio-n8n-7xzf6n.sliplane.app`
- **Internal Host:** `n8nio-n8n-7xzf6n.internal:5678`
- **Deploy Hook:** Available for automated deployments
- **Image:** `docker.io/n8nio/n8n:latest`

## 🔧 **Exact Sliplane Configuration Required**

### **1. Run Config**
```bash
CMD Override: n8n start
```

### **2. Environment Variables (Complete List)**
```bash
# Basic Configuration
HOST=0.0.0.0
N8N_PORT=5678

# Your existing encryption key (keep it)
N8N_ENCRYPTION_KEY=[your existing key]

# Critical Webhook Configuration
WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app/
N8N_HOST=n8nio-n8n-7xzf6n.sliplane.app
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true

# Production Settings
N8N_DISABLE_PRODUCTION_MAIN_PROCESS=false
N8N_PAYLOAD_SIZE_MAX=16777216

# Database (if using external DB)
# DB_TYPE=postgresdb
# DB_POSTGRESDB_HOST=[your-db-host]
# DB_POSTGRESDB_PORT=5432
# DB_POSTGRESDB_DATABASE=n8n
# DB_POSTGRESDB_USER=[your-db-user]
# DB_POSTGRESDB_PASSWORD=[your-db-password]
```

### **3. Healthcheck Path**
```bash
Healthcheck Path: /healthz
```

## 🚨 **Critical Configuration Points**

### **Port Configuration:**
- **Internal Port:** 5678 (n8n default)
- **External Port:** 443/80 (handled by Sliplane)
- **N8N_PORT should be:** `5678` (not 443)

### **WEBHOOK_URL Format:**
```bash
# Correct format (with trailing slash)
WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app/

# NOT this format
WEBHOOK_URL=https://$SLIPLANE_DOMAIN
```

### **Host Configuration:**
```bash
# For binding (internal)
HOST=0.0.0.0

# For webhook URLs (external)
N8N_HOST=n8nio-n8n-7xzf6n.sliplane.app
```

## 📋 **Step-by-Step Implementation**

### **Step 1: Update Run Config**
1. Go to Sliplane dashboard
2. Navigate to your n8n service
3. Go to "Run Config" section
4. Change CMD Override from `echo 'Hello world!'` to `n8n start`
5. Save changes

### **Step 2: Update Environment Variables**
1. Go to "Environment Variables" section
2. Update existing variables:
   ```bash
   HOST=0.0.0.0  # (keep existing)
   N8N_ENCRYPTION_KEY=[keep existing]  # (don't change)
   WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app/  # (fix this)
   ```

3. Add new variables:
   ```bash
   N8N_PORT=5678
   N8N_HOST=n8nio-n8n-7xzf6n.sliplane.app
   N8N_PROTOCOL=https
   N8N_SECURE_COOKIE=true
   N8N_DISABLE_PRODUCTION_MAIN_PROCESS=false
   N8N_PAYLOAD_SIZE_MAX=16777216
   ```

### **Step 3: Update Healthcheck**
1. Go to "Healthchecks" section
2. Change from `/` to `/healthz`
3. Save changes

### **Step 4: Deploy Changes**
1. Save all configuration changes
2. Restart the service (or trigger deploy hook)
3. Wait 3-5 minutes for full startup
4. Monitor logs for successful startup

## 🧪 **Testing After Configuration**

### **Test 1: Service Health**
```bash
curl https://n8nio-n8n-7xzf6n.sliplane.app/healthz
# Should return 200 OK
```

### **Test 2: API Access**
```bash
curl -H "X-N8N-API-KEY: [your-key]" https://n8nio-n8n-7xzf6n.sliplane.app/api/v1/workflows
# Should return workflow list
```

### **Test 3: Webhook Registration**
```bash
# Run our test script
cd frontend && node fix-sliplane-webhook.cjs
# Should show webhooks registering successfully
```

## 🔄 **Automated Deploy Using Deploy Hook**

You can trigger deployments programmatically:
```bash
curl -X GET "https://api.sliplane.io/deploy/service_r1w9ajv2l7ui/dhs_5vq5u9n410s1kete1twdbaab"
```

## ⚠️ **Common Issues and Solutions**

### **Issue: Container Starts but n8n Doesn't**
- **Cause:** Wrong CMD Override
- **Solution:** Use `n8n start` not `echo 'Hello world!'`

### **Issue: Webhooks Return 404**
- **Cause:** Missing WEBHOOK_URL or wrong format
- **Solution:** Set exact URL with trailing slash

### **Issue: SSL/HTTPS Errors**
- **Cause:** Missing protocol configuration
- **Solution:** Set N8N_PROTOCOL=https and N8N_SECURE_COOKIE=true

### **Issue: Database Connection Problems**
- **Cause:** Missing DB configuration
- **Solution:** Add DB environment variables if using external database

## 🎯 **Expected Results After Fix**

Once properly configured:
- ✅ n8n web interface accessible at `https://n8nio-n8n-7xzf6n.sliplane.app`
- ✅ API endpoints respond correctly
- ✅ Webhooks register and respond with 200 status
- ✅ Both webhook and cron workflows functional
- ✅ Telegram bot integration working
- ✅ AI document processing operational

## 📊 **Verification Checklist**

After making changes:
- [ ] Service restarts successfully
- [ ] Healthcheck returns 200 OK
- [ ] n8n web interface loads
- [ ] API endpoints accessible
- [ ] Workflows show as active
- [ ] Webhook endpoints return 200 (not 404)
- [ ] Test documents process successfully

The key insight from your server info is that n8n runs internally on port 5678, but Sliplane routes external traffic through 443/80. The configuration needs to account for this port mapping while ensuring webhooks use the external domain.