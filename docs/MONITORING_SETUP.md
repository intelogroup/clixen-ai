# n8n Workflow Monitoring with Grafana Cloud

## Quick Start Guide

This guide provides a comprehensive monitoring solution for n8n workflows using Grafana Cloud, Loki, and Supabase.

## Features

- 📊 **Real-time Dashboard** - Monitor workflow performance
- 🚨 **Error Tracking** - Automatic error capture and alerting
- 📈 **Performance Metrics** - Execution times, success rates
- 📝 **Structured Logging** - Dual storage in Supabase and Loki
- 🔔 **Smart Alerts** - Telegram notifications for critical issues
- 🗄️ **Data Retention** - 30-day history with automatic cleanup

## Setup Instructions

### 1. Prerequisites

- **Grafana Cloud Account** - [Sign up free](https://grafana.com/products/cloud/)
- **n8n Cloud** - API access enabled
- **Supabase** (optional) - For structured data storage
- **Telegram Bot** (optional) - For alerts

### 2. Configuration

1. Copy the environment template:
```bash
cp .env.grafana.example .env.grafana
```

2. Edit `.env.grafana` with your credentials:
- Get Loki credentials from Grafana Cloud portal
- Add your n8n API key and base URL
- (Optional) Add Supabase and Telegram credentials

### 3. Installation

```bash
# Run the setup script
./scripts/setup-monitoring.sh

# Or manually:
npm run setup:grafana      # Test Grafana connection
npm run deploy:monitoring   # Deploy monitoring workflows
```

### 4. Database Setup (Supabase)

If using Supabase, create the logging tables:
1. Go to Supabase SQL editor
2. Run the SQL from `scripts/supabase/create-logging-schema.sql`

### 5. Configure n8n

1. Open your n8n instance
2. Add credentials:
   - **Supabase**: Your project URL and anon key
   - **HTTP Basic Auth**: Loki username and API key
   - **Telegram Bot**: Bot token (optional)
3. Activate the monitoring workflows
4. Set "Global Error Handler" as error workflow in settings

### 6. Import Dashboards

1. Log into Grafana Cloud
2. Go to Dashboards → Import
3. Upload JSON files from `dashboards/` folder
4. Configure data sources (Loki and Supabase)

## Architecture

```
n8n Workflows
     ↓
Error Handler → Execution Logger
     ↓              ↓
  Supabase      Grafana Loki
     ↓              ↓
    Grafana Dashboards
         ↓
    Alerts & Insights
```

## Monitoring Components

### Global Error Handler
- Captures all workflow errors automatically
- Logs to Supabase and Loki
- Sends Telegram alerts for critical errors
- Tracks error patterns and trends

### Execution Logger
- Runs every minute
- Collects execution metrics
- Calculates performance statistics
- Stores data for analysis

### Dashboards
- **Workflow Performance**: Execution rates, success/failure ratios
- **Node Analytics**: Node usage and performance
- **Error Tracking**: Recent errors and patterns
- **Real-time Monitoring**: Live execution stream

## Security Notes

- Never commit credentials to version control
- Use environment variables for all secrets
- Rotate API keys regularly
- Enable RLS in Supabase for data protection

## Troubleshooting

### Logs not appearing?
- Check Loki credentials in `.env.grafana`
- Verify network connectivity
- Test with: `npm run test:loki`

### Missing execution data?
- Ensure "Execution Logger" workflow is active
- Check n8n API credentials
- Verify Supabase connection

### Alerts not working?
- Verify Telegram bot token
- Check chat ID is correct
- Ensure error workflow is configured

## Support

For detailed documentation, see `docs/MONITORING.md`

## License

MIT