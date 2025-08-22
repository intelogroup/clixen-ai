#!/bin/bash

# Setup script for Grafana monitoring

echo "=================================================="
echo "GRAFANA MONITORING SETUP FOR N8N"
echo "=================================================="
echo ""
echo "This script will help you set up monitoring for your n8n workflows."
echo ""
echo "Prerequisites:"
echo "1. Grafana Cloud account (free tier available)"
echo "2. Supabase account (optional, for structured logging)"
echo "3. n8n Cloud API access"
echo ""
echo "Steps:"
echo "1. Copy .env.grafana.example to .env.grafana"
echo "2. Fill in your credentials in .env.grafana"
echo "3. Run: npm run setup:grafana"
echo "4. Run: npm run deploy:monitoring"
echo "5. Import dashboards to Grafana from dashboards/ folder"
echo ""
echo "For detailed instructions, see docs/MONITORING.md"
echo ""

# Check if .env.grafana exists
if [ ! -f .env.grafana ]; then
    echo "Creating .env.grafana from template..."
    cp .env.grafana.example .env.grafana
    echo "✅ Created .env.grafana - please edit it with your credentials"
else
    echo "✅ .env.grafana already exists"
fi

echo ""
echo "Next steps:"
echo "1. Edit .env.grafana with your actual credentials"
echo "2. Run: npm run setup:grafana"
echo "3. Run: npm run deploy:monitoring"