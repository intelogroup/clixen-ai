# N8N MCP Integration Guide

## Overview

This project now uses the **czlonkowski n8n-mcp** package to provide intelligent workflow orchestration with:

- 🔍 **Intent Validation**: AI-powered understanding of workflow requirements
- 🎯 **Node Search**: Smart discovery of relevant n8n nodes (535+ nodes covered)
- 🔨 **JSON Creation**: Automated workflow generation from natural language
- 🩺 **Validation & Healing**: Automatic error detection and fixing
- 🚀 **Deployment**: Direct push to n8n instance via API
- ⚡ **Activation**: Workflow activation with node-level error reporting

## Architecture

```
Intent Description
        ↓
    Intent Validation (n8n-mcp)
        ↓
    Node Search & Selection (n8n-mcp)
        ↓
    Workflow JSON Creation
        ↓
    Validation & Healing (n8n-mcp)
        ↓
    Deploy to N8N Instance
        ↓
    Activate & Check Errors
```

## Installation & Setup

### 1. Initial Setup

```bash
# Install dependencies (already done)
npm install

# Run setup script
npm run setup-mcp

# Copy environment configuration
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file:

```bash
# N8N Instance Configuration
N8N_API_KEY=your_n8n_api_key_here
N8N_BASE_URL=https://your-instance.n8n.cloud
N8N_WEBHOOK_URL=https://your-instance.n8n.cloud/webhook

# N8N MCP Configuration
N8N_MCP_MODE=stdio
N8N_MCP_HTTP_PORT=3001
N8N_MCP_LOG_LEVEL=info
N8N_DOCS_PATH=../n8n-docs
```

### 3. Verify Installation

```bash
# Test MCP connectivity
npx n8n-mcp --help

# Test intent validation
npm run validate-intent -- --intent "send email notification"
```

## Usage

### Command Line Interface

#### 1. Validate Intent and Get Node Suggestions

```bash
npm run validate-intent -- --intent "process CSV data and send Slack notifications"
```

**Output Example:**
```json
{
  "valid": true,
  "nodes": [
    {
      "type": "n8n-nodes-base.csvFile",
      "category": "Data Processing",
      "description": "Read and parse CSV files"
    },
    {
      "type": "n8n-nodes-base.slack",
      "category": "Communication",
      "description": "Send messages to Slack channels"
    }
  ],
  "recommendations": [...]
}
```

#### 2. Create Complete Workflow

```bash
npm run create-workflow -- \
  --intent "Monitor website changes and notify team via email" \
  --name "Website Monitor" \
  --activate
```

**Process Flow:**
1. 🔍 Validates intent against n8n node database
2. 🎯 Searches for relevant nodes (HTTP Request, Email, Schedule Trigger, etc.)
3. 🔨 Creates workflow JSON with proper connections
4. 🩺 Validates and heals any structural issues
5. 🚀 Deploys to your n8n instance
6. ⚡ Activates workflow and reports any errors

### Programmatic Usage

```javascript
const N8nWorkflowOrchestrator = require('./scripts/n8n-workflow-orchestrator.js');

const orchestrator = new N8nWorkflowOrchestrator();

// Complete workflow orchestration
const result = await orchestrator.orchestrateWorkflow(
  "Create customer support ticket when form is submitted",
  "Customer Support Automation",
  true // activate after deployment
);

console.log(`Workflow created: ${result.workflowId}`);
```

## Features

### 1. Intent Validation

The system uses n8n-mcp to understand natural language workflow descriptions:

```javascript
// Examples of supported intents:
"Send daily sales reports via email"
"Process webhook data and store in Airtable"
"Monitor RSS feeds and post to social media"
"Backup database and notify on completion"
"Sync customer data between Salesforce and HubSpot"
```

### 2. Smart Node Discovery

Leverages n8n-mcp's comprehensive node database:
- **535+ nodes** from n8n-nodes-base and @n8n/n8n-nodes-langchain
- **99% property coverage** with detailed schemas
- **63.6% operation coverage** of available actions
- **90% documentation coverage** from official n8n docs

### 3. Workflow Healing

Automatic error detection and fixing:
- JSON syntax errors
- Missing required fields
- Invalid node connections
- Type mismatches
- API compatibility issues

### 4. Node-Level Error Reporting

After workflow activation, the system:
1. Executes a test run
2. Captures node-specific errors
3. Reports detailed error information
4. Suggests fixes when possible

## API Reference

### N8nWorkflowOrchestrator Class

#### Constructor
```javascript
const orchestrator = new N8nWorkflowOrchestrator();
```

#### Methods

##### `orchestrateWorkflow(intent, workflowName, activate)`
Complete workflow creation pipeline.

**Parameters:**
- `intent` (string): Natural language description
- `workflowName` (string): Workflow name
- `activate` (boolean): Auto-activate after deployment

**Returns:**
```javascript
{
  success: boolean,
  workflowId: string,
  workflow: object,
  healed: boolean
}
```

##### `validateIntent(workflowDescription)`
Validate intent and get node suggestions.

**Returns:**
```javascript
{
  valid: boolean,
  nodes: array,
  recommendations: array
}
```

##### `createWorkflowJSON(intent, validatedNodes, workflowName)`
Generate workflow JSON from validated components.

##### `validateAndHealWorkflow(workflow)`
Validate and automatically fix workflow issues.

##### `deployWorkflow(workflow, activate)`
Deploy workflow to n8n instance.

##### `getNodeLevelErrors(workflowId)`
Check for runtime errors after activation.

## Configuration

### MCP Server Configuration (`config/n8n-mcp.json`)

```json
{
  "server": {
    "mode": "stdio",
    "httpPort": 3001,
    "logLevel": "info"
  },
  "n8n": {
    "docsPath": "../n8n-docs",
    "nodeDatabase": {
      "rebuild": false,
      "cacheExpiry": "24h"
    }
  },
  "features": {
    "nodeSearch": true,
    "intentValidation": true,
    "workflowHealing": true,
    "configValidation": true
  },
  "limits": {
    "maxNodes": 100,
    "maxSearchResults": 20,
    "timeoutMs": 5000
  }
}
```

## Troubleshooting

### Common Issues

#### 1. MCP Server Won't Start
```bash
# Check n8n-mcp installation
npx n8n-mcp --version

# Reinstall if needed
npm uninstall n8n-mcp
npm install n8n-mcp@latest
```

#### 2. Intent Validation Fails
```bash
# Check MCP server logs
N8N_MCP_LOG_LEVEL=debug npm run validate-intent -- --intent "your intent"
```

#### 3. Deployment Errors
- Verify N8N_API_KEY is correct
- Check N8N_BASE_URL format
- Ensure n8n instance is accessible

#### 4. Node-Level Errors
- Review workflow logic
- Check node parameter requirements
- Verify external service configurations

### Debug Mode

Enable detailed logging:

```bash
export N8N_MCP_LOG_LEVEL=debug
export LOG_LEVEL=debug

npm run create-workflow -- --intent "your intent" --name "test"
```

## Migration from Old MCP

The old custom MCP implementation has been backed up to `backup/old-mcp/` and replaced with the czlonkowski package for:

✅ **Better Coverage**: 535+ nodes vs custom subset  
✅ **Maintained**: Regular updates and community support  
✅ **Enhanced Features**: Intent validation, healing, documentation  
✅ **Reliability**: Battle-tested in production environments  

## Examples

### Simple Email Notification

```bash
npm run create-workflow -- \
  --intent "Send email when webhook receives data" \
  --name "Email Notification" \
  --activate
```

### Data Processing Pipeline

```bash
npm run create-workflow -- \
  --intent "Download CSV from URL, process data, save to Google Sheets" \
  --name "Data Pipeline" \
  --activate
```

### Social Media Automation

```bash
npm run create-workflow -- \
  --intent "Monitor RSS feed and post new articles to Twitter and LinkedIn" \
  --name "Social Media Bot" \
  --activate
```

### Customer Support Automation

```bash
npm run create-workflow -- \
  --intent "Create Zendesk ticket when contact form is submitted and notify team on Slack" \
  --name "Support Automation" \
  --activate
```

## Best Practices

1. **Test First**: Always test workflows in development before production
2. **Backup**: Export existing workflows before modifications
3. **Monitor**: Check workflow execution logs regularly
4. **Iterate**: Use intent validation to refine workflow descriptions
5. **Document**: Keep track of successful intent patterns for reuse

## Support

- **n8n-mcp Issues**: https://github.com/czlonkowski/n8n-mcp/issues
- **n8n Documentation**: https://docs.n8n.io/
- **Project Issues**: Use this repository's issue tracker

---

*Powered by [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) - AI-Powered n8n Workflow Automation*