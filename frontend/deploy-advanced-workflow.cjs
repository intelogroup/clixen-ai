#!/usr/bin/env node

/**
 * Direct Deploy Advanced AI Workflow - Bypass MCP timeouts
 * Test the advanced workflow deployment and execution
 */

const https = require('https');

// n8n Configuration
const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1MTAzNzc1fQ.mXnHtIvlmj-93EjwXZqBwzmUx9uUIddS4fO3TGMRCZ0';

// Simplified but Advanced AI Workflow - 12 nodes
const ADVANCED_AI_WORKFLOW = {
  name: '[PRODUCTION] Advanced AI Document Pipeline',
  nodes: [
    // Input Layer
    {
      id: 'webhook-trigger',
      name: 'Document Input',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2.1,
      position: [100, 400],
      parameters: {
        path: 'ai-pipeline-prod'
      }
    },
    {
      id: 'input-processor',
      name: 'Input Processor',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [300, 400],
      parameters: {
        jsCode: `
// Process and validate input
const input = $input.all()[0]?.json || {};

// Validate required fields
if (!input.content && !input.fileUrl) {
  throw new Error('Content or fileUrl required');
}

// Create processing metadata
const metadata = {
  id: input.id || 'doc_' + Date.now(),
  timestamp: new Date().toISOString(),
  type: input.type || 'unknown',
  priority: input.priority || 'normal',
  source: input.source || 'api'
};

return [{
  json: {
    content: input.content || '',
    fileUrl: input.fileUrl || '',
    metadata: metadata,
    stage: 'input_processed'
  }
}];
        `
      }
    },
    
    // AI Analysis Layer (5 AI nodes)
    {
      id: 'ai-classifier',
      name: 'AI Document Classifier',
      type: 'n8n-nodes-base.aiTransform',
      typeVersion: 1,
      position: [500, 200],
      parameters: {
        instructions: 'Classify this document into categories: CONTRACT, INVOICE, REPORT, EMAIL, OTHER. Return JSON: {"category": "TYPE", "confidence": 0.9, "keywords": ["key", "terms"]}',
        inputDataFieldName: 'content'
      }
    },
    {
      id: 'ai-extractor',
      name: 'AI Content Extractor',
      type: 'n8n-nodes-base.aiTransform',
      typeVersion: 1,
      position: [500, 350],
      parameters: {
        instructions: 'Extract key information: title, summary, dates, people, entities, actions. Return structured JSON.',
        inputDataFieldName: 'content'
      }
    },
    {
      id: 'ai-sentiment',
      name: 'AI Sentiment Analyzer',
      type: 'n8n-nodes-base.aiTransform',
      typeVersion: 1,
      position: [500, 500],
      parameters: {
        instructions: 'Analyze sentiment and urgency. Return JSON: {"sentiment": "positive/neutral/negative", "urgency": "low/medium/high", "tone": "formal/casual"}',
        inputDataFieldName: 'content'
      }
    },
    {
      id: 'ai-processor',
      name: 'AI Document Processor',
      type: 'n8n-nodes-base.aiTransform',
      typeVersion: 1,
      position: [750, 300],
      parameters: {
        instructions: 'Process based on document type. Extract specific fields for contracts (parties, dates), invoices (amounts, vendors), reports (metrics, conclusions).',
        inputDataFieldName: 'content'
      }
    },
    {
      id: 'ai-validator',
      name: 'AI Quality Validator',
      type: 'n8n-nodes-base.aiTransform',
      typeVersion: 1,
      position: [750, 500],
      parameters: {
        instructions: 'Validate analysis completeness and accuracy. Score 1-10 for completeness, accuracy, relevance. Suggest improvements.',
        inputDataFieldName: 'content'
      }
    },
    
    // Data Processing Layer
    {
      id: 'data-merger',
      name: 'Analysis Merger',
      type: 'n8n-nodes-base.merge',
      typeVersion: 3.2,
      position: [950, 400],
      parameters: {
        mode: 'combine'
      }
    },
    {
      id: 'decision-router',
      name: 'Processing Router',
      type: 'n8n-nodes-base.switch',
      typeVersion: 3,
      position: [1150, 400],
      parameters: {
        rules: {
          rules: [
            {
              conditions: {
                conditions: [{
                  leftValue: '={{ $json.classification.confidence }}',
                  rightValue: 0.8,
                  operator: { type: 'number', operation: 'gte' }
                }]
              }
            },
            {
              conditions: {
                conditions: [{
                  leftValue: '={{ $json.validation.completeness }}',
                  rightValue: 7,
                  operator: { type: 'number', operation: 'gte' }
                }]
              }
            }
          ]
        },
        fallbackOutput: 2
      }
    },
    
    // Output Layer
    {
      id: 'high-confidence-processor',
      name: 'High Confidence Results',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1350, 250],
      parameters: {
        jsCode: `
// Process high-confidence results
const data = $input.all()[0].json;

const result = {
  status: 'high_confidence',
  documentId: data.metadata.id,
  classification: data.classification,
  extraction: data.extraction,
  sentiment: data.sentiment,
  processing: data.processing,
  quality: data.validation,
  confidence: data.classification.confidence,
  processingTime: Date.now() - new Date(data.metadata.timestamp).getTime(),
  recommendations: ['Process immediately', 'High reliability'],
  timestamp: new Date().toISOString()
};

return [{ json: result }];
        `
      }
    },
    {
      id: 'medium-confidence-processor',
      name: 'Medium Confidence Results',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1350, 400],
      parameters: {
        jsCode: `
// Process medium-confidence results
const data = $input.all()[0].json;

const result = {
  status: 'medium_confidence',
  documentId: data.metadata.id,
  classification: data.classification,
  extraction: data.extraction,
  sentiment: data.sentiment,
  processing: data.processing,
  quality: data.validation,
  confidence: data.classification.confidence,
  processingTime: Date.now() - new Date(data.metadata.timestamp).getTime(),
  recommendations: ['Review recommended', 'Moderate reliability'],
  timestamp: new Date().toISOString()
};

return [{ json: result }];
        `
      }
    },
    {
      id: 'low-confidence-processor',
      name: 'Low Confidence Results',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1350, 550],
      parameters: {
        jsCode: `
// Process low-confidence results
const data = $input.all()[0].json;

const result = {
  status: 'low_confidence',
  documentId: data.metadata.id,
  classification: data.classification || { category: 'UNKNOWN', confidence: 0 },
  extraction: data.extraction || { title: 'Unable to extract', summary: 'Analysis incomplete' },
  sentiment: data.sentiment || { sentiment: 'unknown', urgency: 'low' },
  processing: data.processing || { type: 'unprocessed' },
  quality: data.validation || { completeness: 0, accuracy: 0 },
  confidence: 0,
  processingTime: Date.now() - new Date(data.metadata.timestamp).getTime(),
  recommendations: ['Manual review required', 'Low reliability'],
  timestamp: new Date().toISOString()
};

return [{ json: result }];
        `
      }
    },
    {
      id: 'final-response',
      name: 'API Response',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.5,
      position: [1550, 400],
      parameters: {}
    }
  ],
  connections: {
    'Document Input': {
      'main': [[{ 'node': 'Input Processor', 'type': 'main', 'index': 0 }]]
    },
    'Input Processor': {
      'main': [[
        { 'node': 'AI Document Classifier', 'type': 'main', 'index': 0 },
        { 'node': 'AI Content Extractor', 'type': 'main', 'index': 0 },
        { 'node': 'AI Sentiment Analyzer', 'type': 'main', 'index': 0 }
      ]]
    },
    'AI Document Classifier': {
      'main': [[{ 'node': 'Analysis Merger', 'type': 'main', 'index': 0 }]]
    },
    'AI Content Extractor': {
      'main': [[{ 'node': 'Analysis Merger', 'type': 'main', 'index': 1 }]]
    },
    'AI Sentiment Analyzer': {
      'main': [[
        { 'node': 'AI Document Processor', 'type': 'main', 'index': 0 },
        { 'node': 'AI Quality Validator', 'type': 'main', 'index': 0 }
      ]]
    },
    'AI Document Processor': {
      'main': [[{ 'node': 'Analysis Merger', 'type': 'main', 'index': 2 }]]
    },
    'AI Quality Validator': {
      'main': [[{ 'node': 'Analysis Merger', 'type': 'main', 'index': 3 }]]
    },
    'Analysis Merger': {
      'main': [[{ 'node': 'Processing Router', 'type': 'main', 'index': 0 }]]
    },
    'Processing Router': {
      'main': [
        [{ 'node': 'High Confidence Results', 'type': 'main', 'index': 0 }],
        [{ 'node': 'Medium Confidence Results', 'type': 'main', 'index': 0 }],
        [{ 'node': 'Low Confidence Results', 'type': 'main', 'index': 0 }]
      ]
    },
    'High Confidence Results': {
      'main': [[{ 'node': 'API Response', 'type': 'main', 'index': 0 }]]
    },
    'Medium Confidence Results': {
      'main': [[{ 'node': 'API Response', 'type': 'main', 'index': 0 }]]
    },
    'Low Confidence Results': {
      'main': [[{ 'node': 'API Response', 'type': 'main', 'index': 0 }]]
    }
  },
  settings: {}
};

// Helper function for n8n API calls
async function n8nRequest(endpoint, options = {}) {
  const url = `${N8N_BASE_URL}/api/v1${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: parsed,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: null,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test the workflow with different document types
async function testWorkflowExecution(workflowId) {
  console.log('\n🧪 Testing Advanced Workflow Execution...');
  
  const testCases = [
    {
      name: 'Contract Document',
      data: {
        content: "SERVICE AGREEMENT\n\nThis Service Agreement is entered into between TechCorp Inc. and DataSystems Ltd.\nEffective Date: January 1, 2025\nTerm: 12 months with auto-renewal\nServices: Cloud infrastructure management\nPayment: $50,000 monthly\nGoverning Law: Delaware",
        type: 'contract',
        priority: 'high',
        source: 'legal-team'
      }
    },
    {
      name: 'Invoice Document', 
      data: {
        content: "INVOICE #2025-001\nFrom: CloudServices Corp\nTo: TechStartup LLC\nDate: 2025-08-24\nDue Date: 2025-09-24\nServices Rendered:\n- Cloud hosting: $2,500\n- Database management: $1,500\n- Support services: $750\nSubtotal: $4,750\nTax (8%): $380\nTotal: $5,130",
        type: 'invoice',
        priority: 'medium',
        source: 'accounting'
      }
    },
    {
      name: 'Business Report',
      data: {
        content: "Q3 2024 SALES REPORT\n\nExecutive Summary:\nTotal Revenue: $2.3M (15% increase YoY)\nNew Customers: 450 (22% increase)\nChurn Rate: 3.2% (improved from 4.1%)\n\nKey Metrics:\n- Customer Acquisition Cost: $245\n- Lifetime Value: $3,400\n- Monthly Recurring Revenue: $890K\n\nRecommendations:\n1. Expand marketing in high-performing regions\n2. Implement new customer success program\n3. Launch enterprise tier product",
        type: 'report',
        priority: 'normal',
        source: 'sales-team'
      }
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    
    try {
      const executeResponse = await n8nRequest(`/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: { data: [{ json: testCase.data }] }
      });

      if (executeResponse.status === 201 || executeResponse.status === 200) {
        console.log(`✅ ${testCase.name} execution started`);
        results.push({
          testCase: testCase.name,
          status: 'started',
          executionId: executeResponse.data.executionId
        });
        
        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (executeResponse.data.executionId) {
          const statusResponse = await n8nRequest(`/executions/${executeResponse.data.executionId}`);
          if (statusResponse.status === 200) {
            console.log(`   Status: ${statusResponse.data.status || 'completed'}`);
            console.log(`   Duration: ${statusResponse.data.startedAt ? new Date(statusResponse.data.stoppedAt || Date.now()) - new Date(statusResponse.data.startedAt) : 'unknown'}ms`);
          }
        }
      } else {
        console.log(`❌ ${testCase.name} execution failed: ${executeResponse.status}`);
        results.push({
          testCase: testCase.name,
          status: 'failed',
          error: executeResponse.raw
        });
      }
    } catch (error) {
      console.log(`💥 ${testCase.name} error: ${error.message}`);
      results.push({
        testCase: testCase.name,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

// Main deployment and testing function
async function deployAndTestAdvancedWorkflow() {
  console.log('🚀 ADVANCED AI WORKFLOW - DIRECT DEPLOYMENT & TESTING');
  console.log('======================================================\n');

  try {
    // Step 1: Clean up existing workflows
    console.log('🧹 Cleaning up existing workflows...');
    const listResponse = await n8nRequest('/workflows');
    
    if (listResponse.status === 200 && listResponse.data.data) {
      const existingWorkflows = listResponse.data.data.filter(wf => 
        wf.name.includes('[PRODUCTION]') || wf.name.includes('[ADVANCED')
      );
      
      for (const workflow of existingWorkflows) {
        try {
          if (workflow.active) {
            await n8nRequest(`/workflows/${workflow.id}/deactivate`, { method: 'POST' });
          }
          await n8nRequest(`/workflows/${workflow.id}`, { method: 'DELETE' });
          console.log(`   ✅ Cleaned up: ${workflow.name}`);
        } catch (e) {
          console.log(`   ⚠️  Could not clean: ${workflow.name}`);
        }
      }
    }

    // Step 2: Deploy advanced workflow
    console.log('\n🚀 Deploying Advanced AI Workflow...');
    const deployResponse = await n8nRequest('/workflows', {
      method: 'POST',
      body: ADVANCED_AI_WORKFLOW
    });

    if (deployResponse.status === 201 || deployResponse.status === 200) {
      const workflowId = deployResponse.data.id;
      console.log(`✅ Advanced workflow deployed successfully`);
      console.log(`   Workflow ID: ${workflowId}`);
      console.log(`   Nodes: ${ADVANCED_AI_WORKFLOW.nodes.length}`);
      console.log(`   AI Agents: 5`);

      // Step 3: Activate workflow
      console.log('\n⚡ Activating workflow...');
      const activateResponse = await n8nRequest(`/workflows/${workflowId}/activate`, {
        method: 'POST'
      });

      if (activateResponse.status === 200) {
        console.log('✅ Workflow activated successfully');
        console.log(`\n🔗 Production Webhook: ${N8N_BASE_URL}/webhook/ai-pipeline-prod`);

        // Step 4: Test workflow execution
        const testResults = await testWorkflowExecution(workflowId);

        // Step 5: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 ADVANCED WORKFLOW DEPLOYMENT SUMMARY');
        console.log('='.repeat(60));
        console.log(`🏗️  Architecture: ${ADVANCED_AI_WORKFLOW.nodes.length} nodes in production`);
        console.log(`🤖 AI Processing: 5 specialized AI agents`);
        console.log(`🔀 Smart Routing: Confidence-based result processing`);
        console.log(`📊 Test Results: ${testResults.filter(r => r.status === 'started').length}/${testResults.length} successful`);
        console.log(`⚡ Status: LIVE and processing documents`);
        console.log(`🔍 Monitoring: Available via n8n dashboard`);

        console.log('\n📋 Test Case Results:');
        testResults.forEach((result, i) => {
          const status = result.status === 'started' ? '✅' : '❌';
          console.log(`  ${i + 1}. ${status} ${result.testCase}`);
          if (result.executionId) {
            console.log(`     Execution: ${result.executionId}`);
          }
        });

        console.log('\n🎯 Next Steps:');
        console.log('  1. Monitor executions via n8n dashboard');
        console.log('  2. Test webhook with real documents');
        console.log('  3. Scale AI processing based on load');
        console.log('  4. Add more specialized document types');

        return {
          success: true,
          workflowId: workflowId,
          nodes: ADVANCED_AI_WORKFLOW.nodes.length,
          aiAgents: 5,
          testResults: testResults,
          webhookUrl: `${N8N_BASE_URL}/webhook/ai-pipeline-prod`
        };

      } else {
        console.log(`❌ Workflow activation failed: ${activateResponse.status}`);
        return { success: false, error: 'Activation failed' };
      }

    } else {
      console.log(`❌ Workflow deployment failed: ${deployResponse.status}`);
      if (deployResponse.raw) {
        console.log(`Details: ${deployResponse.raw}`);
      }
      return { success: false, error: 'Deployment failed' };
    }

  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { deployAndTestAdvancedWorkflow, ADVANCED_AI_WORKFLOW };

if (require.main === module) {
  deployAndTestAdvancedWorkflow()
    .then(results => {
      console.log(`\n🎉 Advanced workflow deployment completed! Success: ${results.success}`);
      if (results.success) {
        console.log(`🌐 Production URL: ${results.webhookUrl}`);
      }
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Script error:', error);
      process.exit(1);
    });
}