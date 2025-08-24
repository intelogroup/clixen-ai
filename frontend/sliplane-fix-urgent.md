# 🚨 URGENT: Sliplane n8n Configuration Fix

## **Problem Identified**
Your logs show: `Error: Command "n8n" not found` - this means the CMD Override is incorrect.

## **Immediate Fix Required**

### **Option 1: Remove CMD Override (Recommended)**
**Current:** `n8n start`  
**Change to:** `[EMPTY/DELETE]`

**Steps:**
1. Go to Sliplane dashboard
2. Navigate to "Run Config" 
3. **DELETE** the entire CMD Override field (leave it empty)
4. Save and redeploy

### **Option 2: Use Full Path**
**Change CMD Override to:**
```bash
/usr/local/bin/n8n start
```

### **Option 3: Use Node Command**
**Change CMD Override to:**
```bash
node /usr/local/lib/node_modules/n8n/bin/n8n start
```

## **Why This Happened**
The n8n Docker image has its own default startup command. When you override it with `n8n start`, the container can't find the `n8n` command in the PATH.

## **Current Environment Variables (Keep These)**
```bash
HOST=0.0.0.0
N8N_ENCRYPTION_KEY=[your key]
WEBHOOK_URL=https://n8nio-n8n-7xzf6n.sliplane.app/
N8N_PORT=5678
N8N_HOST=n8nio-n8n-7xzf6n.sliplane.app
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true
N8N_DISABLE_PRODUCTION_MAIN_PROCESS=false
```

## **Deployment Steps**
1. **Remove/Fix CMD Override** (use Option 1 - delete it)
2. Keep all environment variables as they are
3. Save changes
4. Redeploy service
5. Wait 3-5 minutes for startup

## **Expected Log Output After Fix**
Instead of:
```
Error: Command "n8n" not found
```

You should see:
```
n8n ready on 0.0.0.0, port 5678
Version: [version number]
```

## **Test After Fix**
Once deployed successfully, run:
```bash
cd frontend && node fix-sliplane-webhook.cjs
```

The webhooks should now register properly!