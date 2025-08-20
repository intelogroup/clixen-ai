# N8N Workflow Setup Guide for clixen.app.n8n.cloud

## Current Status

Your n8n instance at `https://clixen.app.n8n.cloud` is configured and has 26 workflows created. However, all workflows are currently **inactive**.

## Available Workflows

### Generated Workflows (Ready to Import)
Located in `/workflows/generated/`:
- `customer-service-generated.json` - AI Customer Service Agent
- `data-processing-generated.json` - AI Data Processing Pipeline  
- `integration-generated.json` - Multi-System Integration with AI

### Core Workflows
Located in `/workflows/core/`:
- `01-customer-support-agent.json` - Customer Support with GPT-4/Claude
- `02-data-analysis-agent.json` - Scheduled Data Analysis
- `03-content-generation-agent.json` - Multi-stage Content Pipeline
- `04-multi-agent-orchestrator.json` - Complex Task Orchestration

## Manual Activation Required

Due to n8n API restrictions, workflows need to be activated manually through the UI:

1. **Login to n8n**: https://clixen.app.n8n.cloud
2. **Navigate to Workflows**
3. **Click on a workflow** (e.g., "Simple AI Agent Test")
4. **Toggle the Active switch** in the top-right corner
5. **Save the workflow**

## Testing Active Workflows

Once activated, test your webhooks:

```bash
# Test specific webhook
curl -X POST https://clixen.app.n8n.cloud/webhook/ai-test \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello AI"}'

# Use our testing tool
node scripts/test-webhook.js health
```

## Available Scripts

### List All Workflows
```bash
node scripts/list-workflows.js
```

### Create New Workflows
```bash
# Generate AI-powered workflows
node scripts/workflow-generator.js all

# Create simple test workflow
node scripts/create-simple-workflow.js
```

### Import/Export
```bash
# Export from n8n
node scripts/export-workflow.js

# Import to n8n
node scripts/import-workflow.js
```

### Testing & Benchmarking
```bash
# Test webhooks
node scripts/test-webhook.js customer-support

# Run benchmarks
npm run benchmark

# Validate workflow structure
npm run validate
```

## Webhook URLs (After Activation)

| Workflow | Webhook URL |
|----------|-------------|
| Simple AI Agent Test | https://clixen.app.n8n.cloud/webhook/ai-test |
| Customer Support | https://clixen.app.n8n.cloud/webhook/customer-support |
| Content Generation | https://clixen.app.n8n.cloud/webhook/generate-content |
| Multi-Agent Orchestrator | https://clixen.app.n8n.cloud/webhook/orchestrate |
| Integration | https://clixen.app.n8n.cloud/webhook/integrate |

## Troubleshooting

### Workflow Not Responding
1. Check if workflow is active in n8n UI
2. Verify webhook path is correct
3. Check execution logs in n8n

### API Errors
- "active is read-only": Use n8n UI to activate
- "404 webhook not registered": Workflow is inactive
- "PATCH method not allowed": Use PUT for updates

### Testing Tips
1. Always validate workflows before deploying
2. Start with simple webhooks before complex ones
3. Monitor execution logs for debugging
4. Use our test scripts for load testing

## Next Steps

1. **Activate a workflow** in the n8n UI
2. **Test the webhook** using our scripts
3. **Monitor performance** with benchmarks
4. **Deploy more workflows** as needed

## Support

- N8N Documentation: https://docs.n8n.io
- API Reference: https://docs.n8n.io/api/
- Community Forum: https://community.n8n.io