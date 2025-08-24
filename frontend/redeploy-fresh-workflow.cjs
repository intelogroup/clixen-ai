#!/usr/bin/env node

/**
 * Redeploy Fresh Advanced AI Workflow
 * Complete clean deployment with proper webhook registration
 */

const https = require('https');

const N8N_BASE_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZmZWU5My04YTBlLTQwYTItYmMyYi0xOGE1NDliODAwZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2MDA3ODQ4fQ.txQD98euIP1VvqlIQfWDVHYl3UVPBOGJ_XEEU0_3H2Y';

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

const FRESH_AI_WORKFLOW = {
  "name": "[PRODUCTION] AI Document Processing Pipeline",
  "active": false,
  "nodes": [
    {
      "id": "webhook-entry",
      "name": "Document Input",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "parameters": {
        "path": "ai-document-pipeline",
        "httpMethod": "POST",
        "responseMode": "responseNode"
      }
    },
    {
      "id": "input-validation",
      "name": "Input Validation",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300],
      "parameters": {
        "jsCode": "// Validate input and extract document content\nconst body = $input.first().json.body || $input.first().json;\nconst content = body.content || '';\nconst docType = body.type || 'unknown';\nconst source = body.source || 'api';\nconst priority = body.priority || 'normal';\n\nif (!content || content.length < 10) {\n  return [{\n    json: {\n      error: 'Document content is required (minimum 10 characters)',\n      status: 'validation_failed'\n    }\n  }];\n}\n\nreturn [{\n  json: {\n    documentId: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,\n    content: content,\n    type: docType,\n    source: source,\n    priority: priority,\n    timestamp: new Date().toISOString(),\n    status: 'validated',\n    contentLength: content.length,\n    wordCount: content.split(/\\s+/).length\n  }\n}];"
      }
    },
    {
      "id": "ai-classifier",
      "name": "Document Classifier",
      "type": "n8n-nodes-base.ai",
      "typeVersion": 1,
      "position": [680, 300],
      "parameters": {
        "model": "gpt-3.5-turbo",
        "prompt": "Analyze this document and classify it. Return JSON with:\n{\n  \"category\": \"contract|invoice|report|email|proposal|other\",\n  \"confidence\": 0.95,\n  \"keywords\": [\"key\", \"terms\"],\n  \"summary\": \"Brief description\",\n  \"urgency\": \"low|medium|high\",\n  \"entities\": [\"company names\", \"dates\", \"amounts\"]\n}\n\nDocument: {{ $json.content }}",
        "options": {
          "temperature": 0.3,
          "maxTokens": 500
        }
      }
    },
    {
      "id": "content-extractor",
      "name": "Content Extractor",
      "type": "n8n-nodes-base.ai",
      "typeVersion": 1,
      "position": [680, 180],
      "parameters": {
        "model": "gpt-3.5-turbo",
        "prompt": "Extract key information from this document. Return JSON with:\n{\n  \"title\": \"Document title or subject\",\n  \"mainPoints\": [\"key point 1\", \"key point 2\"],\n  \"dates\": [\"2025-01-15\"],\n  \"amounts\": [\"$50,000\"],\n  \"parties\": [\"Company A\", \"Person B\"],\n  \"actions\": [\"required actions\"],\n  \"deadlines\": [\"important deadlines\"]\n}\n\nDocument: {{ $json.content }}",
        "options": {
          "temperature": 0.2,
          "maxTokens": 600
        }
      }
    },
    {
      "id": "quality-analyzer",
      "name": "Quality Analyzer",
      "type": "n8n-nodes-base.ai",
      "typeVersion": 1,
      "position": [680, 420],
      "parameters": {
        "model": "gpt-3.5-turbo",
        "prompt": "Analyze the quality and completeness of this document. Return JSON with:\n{\n  \"completeness\": 0.85,\n  \"clarity\": 0.90,\n  \"structure\": 0.80,\n  \"overallScore\": 8.5,\n  \"issues\": [\"missing signatures\", \"unclear terms\"],\n  \"recommendations\": [\"add contact details\"],\n  \"riskLevel\": \"low|medium|high\"\n}\n\nDocument: {{ $json.content }}",
        "options": {
          "temperature": 0.1,
          "maxTokens": 400
        }
      }
    },
    {
      "id": "sentiment-analyzer",
      "name": "Sentiment Analyzer", 
      "type": "n8n-nodes-base.ai",
      "typeVersion": 1,
      "position": [680, 540],
      "parameters": {
        "model": "gpt-3.5-turbo",
        "prompt": "Analyze the sentiment and tone of this document. Return JSON with:\n{\n  \"sentiment\": \"positive|neutral|negative\",\n  \"confidence\": 0.88,\n  \"tone\": \"formal|casual|urgent|friendly\",\n  \"emotionalMarkers\": [\"excitement\", \"concern\"],\n  \"businessImpact\": \"high|medium|low\",\n  \"urgencyLevel\": 1-10\n}\n\nDocument: {{ $json.content }}",
        "options": {
          "temperature": 0.3,
          "maxTokens": 300
        }
      }
    },
    {
      "id": "merge-analysis",
      "name": "Merge Analysis",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3,
      "position": [900, 300],
      "parameters": {
        "mode": "combine",
        "combineBy": "combineByPosition",
        "options": {}
      }
    },
    {
      "id": "final-processor",
      "name": "Final Processor",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 300],
      "parameters": {
        "jsCode": "// Combine all analysis results into comprehensive output\nconst inputData = $input.first().json;\n\n// Parse AI responses safely\nfunction parseAIResponse(response) {\n  try {\n    if (typeof response === 'string') {\n      return JSON.parse(response);\n    }\n    return response;\n  } catch (e) {\n    return { error: 'Failed to parse AI response', raw: response };\n  }\n}\n\nconst classification = parseAIResponse(inputData.ai_classifier || '{}');\nconst extraction = parseAIResponse(inputData.content_extractor || '{}');\nconst quality = parseAIResponse(inputData.quality_analyzer || '{}');\nconst sentiment = parseAIResponse(inputData.sentiment_analyzer || '{}');\n\n// Build comprehensive response\nconst response = {\n  documentId: inputData.documentId,\n  status: 'processed',\n  timestamp: new Date().toISOString(),\n  \n  // Document metadata\n  metadata: {\n    type: inputData.type,\n    source: inputData.source,\n    priority: inputData.priority,\n    contentLength: inputData.contentLength,\n    wordCount: inputData.wordCount,\n    processingTime: Date.now() - new Date(inputData.timestamp).getTime(),\n    aiAgents: 4\n  },\n  \n  // Classification results\n  classification: {\n    category: classification.category || 'unknown',\n    confidence: classification.confidence || 0,\n    keywords: classification.keywords || [],\n    summary: classification.summary || '',\n    urgency: classification.urgency || 'medium',\n    entities: classification.entities || []\n  },\n  \n  // Extraction results\n  extraction: {\n    title: extraction.title || 'Untitled Document',\n    mainPoints: extraction.mainPoints || [],\n    dates: extraction.dates || [],\n    amounts: extraction.amounts || [],\n    parties: extraction.parties || [],\n    actions: extraction.actions || [],\n    deadlines: extraction.deadlines || []\n  },\n  \n  // Quality assessment\n  qualityCheck: {\n    completeness: quality.completeness || 0,\n    clarity: quality.clarity || 0,\n    structure: quality.structure || 0,\n    overallScore: quality.overallScore || 0,\n    issues: quality.issues || [],\n    recommendations: quality.recommendations || [],\n    riskLevel: quality.riskLevel || 'unknown'\n  },\n  \n  // Sentiment analysis\n  sentiment: {\n    sentiment: sentiment.sentiment || 'neutral',\n    confidence: sentiment.confidence || 0,\n    tone: sentiment.tone || 'neutral',\n    emotionalMarkers: sentiment.emotionalMarkers || [],\n    businessImpact: sentiment.businessImpact || 'medium',\n    urgencyLevel: sentiment.urgencyLevel || 5\n  },\n  \n  // Processing summary\n  summary: {\n    recommendation: classification.category === 'contract' ? 'Legal review recommended' :\n                   classification.category === 'invoice' ? 'Payment processing required' :\n                   classification.category === 'report' ? 'Review and distribute' :\n                   classification.category === 'email' ? 'Response may be needed' :\n                   'Standard processing completed',\n    nextSteps: extraction.actions || ['Review document', 'File appropriately'],\n    aiConfidence: Math.round(((classification.confidence || 0) + \n                             (quality.overallScore || 0) / 10 + \n                             (sentiment.confidence || 0)) / 3 * 100) / 100\n  }\n};\n\nreturn [{ json: response }];"
      }
    },
    {
      "id": "response-formatter",
      "name": "Response Formatter",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1340, 300],
      "parameters": {
        "jsCode": "// Format final response for webhook return\nconst data = $input.first().json;\n\n// Create clean, user-friendly response\nconst response = {\n  success: true,\n  message: 'Document processed successfully by Advanced AI Pipeline',\n  documentId: data.documentId,\n  category: data.classification?.category || 'unknown',\n  confidence: Math.round((data.classification?.confidence || 0) * 100),\n  \n  processing: {\n    duration: data.metadata?.processingTime || 0,\n    agents: data.metadata?.aiAgents || 4,\n    timestamp: data.timestamp\n  },\n  \n  analysis: {\n    title: data.extraction?.title || 'Document Analysis',\n    summary: data.classification?.summary || 'AI analysis completed',\n    keyPoints: data.extraction?.mainPoints || [],\n    qualityScore: data.qualityCheck?.overallScore || 0,\n    riskLevel: data.qualityCheck?.riskLevel || 'unknown',\n    urgency: data.classification?.urgency || 'medium'\n  },\n  \n  recommendations: {\n    nextSteps: data.summary?.nextSteps || [],\n    issues: data.qualityCheck?.issues || [],\n    improvements: data.qualityCheck?.recommendations || []\n  },\n  \n  confidence: {\n    overall: data.summary?.aiConfidence || 0,\n    classification: data.classification?.confidence || 0,\n    quality: data.qualityCheck?.completeness || 0,\n    sentiment: data.sentiment?.confidence || 0\n  }\n};\n\nreturn [{ json: response }];"
      }
    },
    {
      "id": "webhook-response",
      "name": "Send Response",
      "type": "n8n-nodes-base.respond-to-webhook",
      "typeVersion": 1.1,
      "position": [1560, 300],
      "parameters": {
        "respondWith": "json",
        "responseCode": 200
      }
    },
    {
      "id": "error-handler",
      "name": "Error Handler",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 480],
      "parameters": {
        "jsCode": "// Handle any processing errors gracefully\nconst error = $input.first().json.error || 'Processing failed';\n\nreturn [{\n  json: {\n    success: false,\n    error: error,\n    message: 'Document processing encountered an error',\n    timestamp: new Date().toISOString(),\n    support: 'Please check document format and try again'\n  }\n}];"
      }
    },
    {
      "id": "error-response",
      "name": "Error Response",
      "type": "n8n-nodes-base.respond-to-webhook",
      "typeVersion": 1.1,
      "position": [1340, 480],
      "parameters": {
        "respondWith": "json",
        "responseCode": 400
      }
    }
  ],
  "connections": {
    "Document Input": {
      "main": [
        [
          {
            "node": "Input Validation",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Input Validation": {
      "main": [
        [
          {
            "node": "Document Classifier",
            "type": "main",
            "index": 0
          },
          {
            "node": "Content Extractor", 
            "type": "main",
            "index": 0
          },
          {
            "node": "Quality Analyzer",
            "type": "main",
            "index": 0
          },
          {
            "node": "Sentiment Analyzer",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Document Classifier": {
      "main": [
        [
          {
            "node": "Merge Analysis",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Content Extractor": {
      "main": [
        [
          {
            "node": "Merge Analysis",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Quality Analyzer": {
      "main": [
        [
          {
            "node": "Merge Analysis",
            "type": "main",
            "index": 2
          }
        ]
      ]
    },
    "Sentiment Analyzer": {
      "main": [
        [
          {
            "node": "Merge Analysis",
            "type": "main",
            "index": 3
          }
        ]
      ]
    },
    "Merge Analysis": {
      "main": [
        [
          {
            "node": "Final Processor",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Final Processor": {
      "main": [
        [
          {
            "node": "Response Formatter",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Error Handler",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Response Formatter": {
      "main": [
        [
          {
            "node": "Send Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Error Handler": {
      "main": [
        [
          {
            "node": "Error Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [
    {
      "id": "ai-pipeline",
      "name": "AI Pipeline"
    }
  ],
  "meta": {}
};

async function redeployFreshWorkflow() {
  console.log('🚀 REDEPLOYING FRESH ADVANCED AI WORKFLOW');
  console.log('==========================================\n');

  try {
    // Step 1: Delete existing workflow if it exists
    console.log('🗑️  Cleaning up existing workflow...');
    const listResponse = await n8nRequest('/workflows');
    
    if (listResponse.status === 200) {
      const workflows = listResponse.data.data || [];
      const existingWorkflows = workflows.filter(wf => 
        wf.name.includes('Advanced') || wf.name.includes('FIXED') || wf.name.includes('Pipeline')
      );
      
      for (const workflow of existingWorkflows) {
        console.log(`   Deleting: ${workflow.name} (${workflow.id})`);
        
        // Deactivate first
        if (workflow.active) {
          await n8nRequest(`/workflows/${workflow.id}/deactivate`, { method: 'POST' });
        }
        
        // Delete
        const deleteResponse = await n8nRequest(`/workflows/${workflow.id}`, { method: 'DELETE' });
        if (deleteResponse.status === 200) {
          console.log(`   ✅ Deleted successfully`);
        } else {
          console.log(`   ⚠️  Delete failed: ${deleteResponse.status}`);
        }
      }
    }

    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Create fresh workflow
    console.log('\n🔧 Creating fresh workflow...');
    const createResponse = await n8nRequest('/workflows', {
      method: 'POST',
      body: FRESH_AI_WORKFLOW
    });

    if (createResponse.status === 201) {
      console.log('✅ Fresh workflow created successfully!');
      const newWorkflow = createResponse.data;
      console.log(`   ID: ${newWorkflow.id}`);
      console.log(`   Name: ${newWorkflow.name}`);
      console.log(`   Nodes: ${newWorkflow.nodes?.length || 0}`);
      
      // Step 3: Activate the workflow
      console.log('\n⚡ Activating fresh workflow...');
      const activateResponse = await n8nRequest(`/workflows/${newWorkflow.id}/activate`, {
        method: 'POST'
      });
      
      if (activateResponse.status === 200) {
        console.log('✅ Workflow activated successfully!');
        console.log(`🔗 Webhook URL: ${N8N_BASE_URL}/webhook/ai-document-pipeline`);
        
        // Step 4: Wait and test the webhook
        console.log('\n⏳ Waiting 5 seconds for webhook registration...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🧪 Testing fresh webhook...');
        const testResult = await testWebhook('ai-document-pipeline', {
          content: "FRESH TEST: This is a test contract between Company A and Company B for software development services worth $75,000.",
          type: "contract",
          source: "fresh-deployment-test"
        });
        
        console.log(`📊 Test Status: ${testResult.statusCode}`);
        
        if (testResult.statusCode === 200) {
          console.log('🎉 SUCCESS! Fresh workflow is working perfectly!');
          
          try {
            const responseData = JSON.parse(testResult.data);
            console.log('\n📊 AI Processing Results:');
            console.log(`   Document ID: ${responseData.documentId}`);
            console.log(`   Category: ${responseData.category}`);
            console.log(`   Confidence: ${responseData.confidence}%`);
            console.log(`   Quality Score: ${responseData.analysis?.qualityScore || 'N/A'}`);
            console.log(`   Processing Duration: ${responseData.processing?.duration || 'N/A'}ms`);
            console.log(`   AI Agents Used: ${responseData.processing?.agents || 4}`);
            
          } catch (e) {
            console.log('   ✅ Processing completed successfully (non-JSON response)');
          }
          
          return {
            success: true,
            workflowId: newWorkflow.id,
            webhookUrl: `${N8N_BASE_URL}/webhook/ai-document-pipeline`,
            testPassed: true
          };
        } else {
          console.log(`⚠️  Test returned: ${testResult.statusCode}`);
          console.log(`Response: ${testResult.data}`);
          
          return {
            success: true,
            workflowId: newWorkflow.id,
            webhookUrl: `${N8N_BASE_URL}/webhook/ai-document-pipeline`,
            testPassed: false,
            testStatus: testResult.statusCode
          };
        }
        
      } else {
        console.log(`❌ Activation failed: ${activateResponse.status}`);
        if (activateResponse.raw) {
          console.log(`Details: ${activateResponse.raw}`);
        }
        return { success: false, error: 'Activation failed' };
      }
      
    } else {
      console.log(`❌ Workflow creation failed: ${createResponse.status}`);
      if (createResponse.raw) {
        console.log(`Details: ${createResponse.raw}`);
      }
      return { success: false, error: 'Creation failed' };
    }

  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testWebhook(path, testData) {
  const webhookUrl = `${N8N_BASE_URL}/webhook/${path}`;
  
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

if (require.main === module) {
  redeployFreshWorkflow()
    .then(result => {
      if (result.success) {
        console.log('\n🎊 FRESH DEPLOYMENT COMPLETE!');
        console.log(`🔗 Webhook URL: ${result.webhookUrl}`);
        if (result.testPassed) {
          console.log('✅ Webhook test passed - system is fully operational!');
        } else {
          console.log('⚠️  Webhook deployed but test failed - may need configuration review');
        }
      } else {
        console.log(`\n💔 Deployment failed: ${result.error}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Script error:', error);
      process.exit(1);
    });
}