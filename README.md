# N8N Core Workflows - Battle Testing Repository

## Overview
Production-ready n8n workflows with AI agent nodes for automated testing and deployment.

## Core Workflows

### 1. Customer Support Agent
- **Endpoint**: `/webhook/customer-support`
- **Features**: Multi-model AI support, context-aware responses, ticket integration
- **Models**: GPT-4, Claude-3

### 2. Data Analysis Agent  
- **Schedule**: Daily at 9 AM
- **Features**: Automated data fetching, trend analysis, report generation
- **Models**: Claude-3-Opus for analysis

### 3. Content Generation Agent
- **Endpoint**: `/webhook/generate-content`
- **Features**: Research + content creation + quality check pipeline
- **Models**: GPT-4-Turbo, Claude-3-Opus

## Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   npm install
   ```

2. **Import Workflows to N8N**
   ```bash
   npm run import
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Run Benchmarks**
   ```bash
   npm run benchmark
   ```

## Project Structure
```
├── workflows/
│   ├── core/          # Production workflows
│   ├── templates/     # Reusable templates
│   └── tests/         # Test workflows
├── data/
│   ├── input/         # Test input data
│   ├── output/        # Test results
│   └── mocks/         # Mock data for testing
├── scripts/           # Automation scripts
├── docs/              # Documentation
└── config/            # Configuration files
```

## Testing

### Unit Tests
Test individual workflow nodes:
```bash
node scripts/test-workflows.js
```

### Load Testing
Stress test workflows:
```bash
node scripts/benchmark.js
```

### Test Scenarios
- Light Load: 5 concurrent, 50 iterations
- Medium Load: 20 concurrent, 100 iterations  
- Heavy Load: 50 concurrent, 200 iterations

## Metrics Tracked
- Response Latency (p50, p95, p99)
- Throughput (requests/second)
- Error Rate
- Resource Usage

## Environment Variables
- `N8N_API_KEY`: Your n8n cloud API key
- `N8N_BASE_URL`: Your n8n instance URL
- `OPENAI_API_KEY`: OpenAI API key for GPT models
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude models

## Best Practices
1. Always test workflows in staging before production
2. Monitor agent token usage and costs
3. Implement proper error handling
4. Use appropriate timeout values
5. Enable workflow execution logs

## Contributing
1. Create feature branch
2. Add tests for new workflows
3. Run benchmark suite
4. Submit PR with test results

## License
MIT - Terragon Labs