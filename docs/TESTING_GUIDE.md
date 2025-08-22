# N8N Workflow Testing Guide

## Quick Start with Your Instance

Your n8n instance is configured at: `https://clixen.app.n8n.cloud`

### 1. Initial Setup
```bash
# Install dependencies
npm install

# Validate workflows before deployment
npm run validate
```

### 2. Deploy Workflows to Your N8N Instance
```bash
# Deploy all workflows and activate them
npm run deploy

# Deploy without activation
npm run deploy -- --no-activate

# Deploy and test webhooks
npm run deploy -- --test
```

### 3. Test Webhooks

#### Test Individual Workflows
```bash
# Test customer support agent
node scripts/test-webhook.js customer-support

# Test content generation
node scripts/test-webhook.js content

# Test orchestrator
node scripts/test-webhook.js orchestrator

# Health check all endpoints
node scripts/test-webhook.js health
```

#### Interactive Testing
```bash
node scripts/test-webhook.js interactive
```

#### Custom Endpoint Testing
```bash
node scripts/test-webhook.js custom your-endpoint -p '{"key":"value"}'
```

### 4. Load Testing & Benchmarking
```bash
# Run full benchmark suite
npm run benchmark

# This will test:
# - Light Load: 5 concurrent requests
# - Medium Load: 20 concurrent requests  
# - Heavy Load: 50 concurrent requests
```

### 5. Import/Export Workflows

#### Export from N8N Cloud
```bash
# Export all workflows
npm run export

# Export specific workflow by ID
node scripts/export-workflow.js <workflow-id>
```

#### Import to N8N Cloud
```bash
# Import all workflows
npm run import

# Import specific workflow
node scripts/import-workflow.js workflow-file.json
```

## Webhook URLs for Your Instance

Once deployed, your webhooks will be available at:

- **Customer Support**: `https://clixen.app.n8n.cloud/webhook/customer-support`
- **Content Generation**: `https://clixen.app.n8n.cloud/webhook/generate-content`
- **Multi-Agent Orchestrator**: `https://clixen.app.n8n.cloud/webhook/orchestrate`

## Testing Payloads

### Customer Support Agent
```json
{
  "query": "How can I reset my password?",
  "context": {
    "userId": "user123",
    "channel": "web",
    "priority": "high"
  }
}
```

### Content Generation Agent
```json
{
  "content_type": "blog_post",
  "topic": "AI Trends in 2024",
  "tone": "professional",
  "length": 1000
}
```

### Multi-Agent Orchestrator
```json
{
  "task": "Research and analyze market trends",
  "subtasks": ["research", "analysis", "generation"],
  "output_format": "report"
}
```

## Monitoring & Debugging

### View Execution Logs
1. Go to your n8n instance: https://clixen.app.n8n.cloud
2. Navigate to Executions tab
3. Filter by workflow name or status

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Webhook returns 404 | Ensure workflow is active in n8n |
| Authentication error | Check N8N_API_KEY in .env |
| Timeout errors | Increase TIMEOUT_MS in .env |
| Agent not responding | Verify AI API keys are configured |

## Performance Metrics

The benchmark tool tracks:
- **Latency**: p50, p95, p99 percentiles
- **Throughput**: Requests per second
- **Error Rate**: Failed request percentage
- **Response Times**: Min/Max/Average

## Best Practices

1. **Always validate before deploying**
   ```bash
   npm run validate && npm run deploy
   ```

2. **Test incrementally**
   - Start with health checks
   - Test individual endpoints
   - Run load tests gradually

3. **Monitor token usage**
   - Track AI model costs
   - Set appropriate rate limits
   - Use caching where possible

4. **Version control workflows**
   - Export before making changes
   - Keep backups of working versions
   - Document changes in commits

## Rollback Procedures

If a deployment causes issues:
```bash
# Deactivate specific workflow
node scripts/deploy-workflows.js --rollback <workflow-id>

# Export current state for backup
npm run export

# Restore from backup
npm run import
```