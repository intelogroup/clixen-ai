# 🔧 Fix Express Trust Proxy Configuration for n8n on Sliplane

## **Problem Confirmed**
Your logs show the exact error we identified:
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default)
```

## **Key Observations from Logs**
✅ **n8n Starting Successfully**: Version 1.107.4, workflows activated
✅ **Webhook Requests Received**: "POST test-ai-processor" requests are reaching n8n
❌ **Webhook Not Registered**: "The requested webhook 'POST test-ai-processor' is not registered"
❌ **Express Trust Proxy**: Misconfiguration preventing proper reverse proxy handling

## **IMMEDIATE SOLUTION**

### **Add This Environment Variable to Sliplane**

Go to your Sliplane n8n service → Environment Variables → Add:

```bash
N8N_TRUST_PROXY_HEADERS=true
```

**OR** (alternative env var name):

```bash
EXPRESS_TRUST_PROXY=true
```

### **Complete Environment Variables List**
Update your Sliplane environment variables to include:

```bash
# Existing (keep these)
HOST=0.0.0.0
N8N_PORT=5678
N8N_ENCRYPTION_KEY=[your existing key]
WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app/
N8N_HOST=n8nio-n8n-7xzf6n.sliplane.app
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true
N8N_DISABLE_PRODUCTION_MAIN_PROCESS=false

# ADD THIS NEW ONE
N8N_TRUST_PROXY_HEADERS=true
```

## **Why This Fixes The Issue**

1. **Sliplane Reverse Proxy**: Sliplane uses reverse proxy that sets `X-Forwarded-For` headers
2. **Express Default**: Express doesn't trust proxy headers by default for security
3. **Rate Limiting Error**: express-rate-limit can't identify users properly without trust proxy
4. **Webhook Registration**: Trust proxy issues prevent proper webhook URL registration

## **Deploy Steps**

1. **Add Environment Variable**:
   ```bash
   N8N_TRUST_PROXY_HEADERS=true
   ```

2. **Save Configuration**

3. **Restart Service** (or use deploy hook):
   ```bash
   curl -X GET "https://api.sliplane.io/deploy/service_r1w9ajv2l7ui/dhs_5vq5u9n410s1kete1twdbaab"
   ```

4. **Wait 3-5 minutes** for full restart

5. **Test Webhook** (should now work):
   ```bash
   cd frontend && node webhook-test.cjs
   ```

## **Expected Result After Fix**

**Instead of:**
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
Received request for unknown webhook: The requested webhook "POST test-ai-processor" is not registered.
```

**You should see:**
```
Webhook registered successfully: POST test-ai-processor
Webhook responded with 200 OK
```

## **Alternative Environment Variables**

If `N8N_TRUST_PROXY_HEADERS=true` doesn't work, try these:

```bash
# Option 1
EXPRESS_TRUST_PROXY=true

# Option 2  
N8N_TRUST_PROXY=true

# Option 3
TRUST_PROXY=true
```

## **Verification**

After deployment, run our webhook test:

```bash
cd frontend && node webhook-test.cjs
```

**Success indicators:**
- ✅ No more "ValidationError" messages in logs
- ✅ No more "trust proxy" warnings
- ✅ Webhook returns 200 instead of 404
- ✅ "Webhook registered successfully" in logs

This should resolve both the Express trust proxy warnings and enable proper webhook registration in the Sliplane reverse proxy environment.