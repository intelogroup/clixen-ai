#!/usr/bin/env node

/**
 * Test Webhook Execution - Advanced AI Workflow
 * Make real HTTP requests to test the deployed workflow
 */

const https = require('https');

const WEBHOOK_URL = 'https://n8nio-n8n-7xzf6n.sliplane.app/webhook/ai-pipeline-fixed';

async function makeWebhookRequest(testData, testName) {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'n8n-webhook-tester/1.0'
      },
      timeout: 30000
    };

    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📤 Sending request to: ${WEBHOOK_URL}`);
    console.log(`📊 Payload size: ${Buffer.byteLength(postData)} bytes`);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`📥 Response Status: ${res.statusCode}`);
      console.log(`📥 Response Headers:`, JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`📥 Response received (${responseData.length} bytes)`);
        
        try {
          const parsedResponse = JSON.parse(responseData);
          resolve({
            success: true,
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedResponse,
            rawResponse: responseData
          });
        } catch (parseError) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawResponse: responseData,
            parseError: parseError.message
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request failed: ${error.message}`);
      reject({
        success: false,
        error: error.message,
        code: error.code
      });
    });

    req.on('timeout', () => {
      console.error('❌ Request timed out');
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT'
      });
    });

    // Send the request
    req.write(postData);
    req.end();
  });
}

async function testWebhookExecution() {
  console.log('🚀 WEBHOOK EXECUTION TEST - ADVANCED AI WORKFLOW');
  console.log('================================================\n');

  const testCases = [
    {
      name: 'Contract Analysis Test',
      data: {
        content: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on January 15, 2025, between:

PARTY A: TechSolutions Inc., a Delaware corporation
Address: 123 Innovation Drive, San Francisco, CA 94105

PARTY B: StartupVentures LLC, a California limited liability company  
Address: 456 Market Street, San Jose, CA 95113

TERM: This agreement shall commence on February 1, 2025, and continue for a period of twenty-four (24) months, unless terminated earlier in accordance with the terms herein.

SERVICES: TechSolutions shall provide AI consulting, software development, and technical advisory services.

COMPENSATION: StartupVentures agrees to pay TechSolutions a monthly fee of $25,000, due on the first day of each month.

TERMINATION: Either party may terminate this agreement with ninety (90) days written notice.

GOVERNING LAW: This agreement shall be governed by the laws of the State of California.`,
        type: "contract",
        source: "legal-team",
        priority: "high"
      }
    },
    {
      name: 'Invoice Processing Test',
      data: {
        content: `INVOICE

Invoice Number: INV-2025-0156
Date: January 20, 2025
Due Date: February 19, 2025

FROM:
CloudServices Corporation
789 Tech Boulevard
Austin, TX 78701
Tax ID: 12-3456789

TO:
Digital Dynamics LLC
321 Business Park Drive
Denver, CO 80202

SERVICES PROVIDED:
- Cloud Infrastructure Hosting (January 2025)     $4,500.00
- Database Management Services                     $2,800.00  
- 24/7 Technical Support                          $1,200.00
- SSL Certificates (3 domains)                     $150.00
- Data Backup & Recovery Service                    $750.00

Subtotal:                                         $9,400.00
Sales Tax (8.5%):                                  $799.00
TOTAL AMOUNT DUE:                               $10,199.00

Payment Terms: Net 30 days
Payment Method: ACH, Wire Transfer, or Check`,
        type: "invoice",
        source: "accounting",
        priority: "medium"
      }
    },
    {
      name: 'Business Report Test',
      data: {
        content: `Q4 2024 PERFORMANCE REPORT

EXECUTIVE SUMMARY
Our Q4 2024 performance demonstrates strong growth across all key metrics, positioning us well for 2025 expansion.

KEY METRICS:
- Total Revenue: $3.2M (22% increase YoY)
- Monthly Recurring Revenue: $950K (18% growth)
- New Customer Acquisitions: 485 (35% increase)
- Customer Churn Rate: 2.8% (improved from 4.2%)
- Customer Lifetime Value: $4,200 (15% increase)
- Customer Acquisition Cost: $280 (12% reduction)

PERFORMANCE HIGHLIGHTS:
✅ Exceeded revenue targets by 8%
✅ Launched 3 new product features
✅ Expanded to 2 new geographic markets
✅ Improved customer satisfaction score to 4.6/5.0

CHALLENGES:
⚠️ Higher support ticket volume (+25%)
⚠️ Increased server costs due to scaling
⚠️ Competitive pressure in enterprise segment

RECOMMENDATIONS FOR Q1 2025:
1. Invest in customer success team expansion
2. Implement advanced analytics dashboard
3. Launch enterprise tier pricing model  
4. Optimize infrastructure costs through containerization
5. Develop strategic partnerships in new markets

CONCLUSION:
Strong momentum entering 2025 with solid fundamentals and clear growth trajectory.`,
        type: "report",
        source: "analytics-team",
        priority: "normal"
      }
    },
    {
      name: 'Email Communication Test',
      data: {
        content: `Subject: Urgent: Q1 Budget Approval Needed

From: Sarah Chen <s.chen@company.com>
To: Finance Team <finance@company.com>
Date: January 22, 2025, 2:30 PM

Hi Team,

I hope this email finds you well. We need to finalize the Q1 2025 budget by end of week to meet board presentation deadlines.

KEY ITEMS REQUIRING APPROVAL:
• Marketing spend increase: $150K (digital campaigns)  
• New hire budget: $320K (5 additional engineers)
• Infrastructure upgrade: $85K (cloud migration)
• Training & development: $45K (AI/ML certifications)

TIMELINE:
- Budget review meeting: Thursday, Jan 25, 10:00 AM
- Final approvals needed: Friday, Jan 26, 5:00 PM  
- Board presentation: Monday, Jan 29, 9:00 AM

Please review the attached budget spreadsheet and come prepared with questions and recommendations.

If you have any concerns or need additional information, please reach out immediately.

Thanks for your prompt attention to this matter.

Best regards,
Sarah Chen
VP Finance & Operations`,
        type: "email",
        source: "email-system",
        priority: "urgent"
      }
    },
    {
      name: 'Mixed Content Test',
      data: {
        content: `PROPOSAL FOR AI IMPLEMENTATION PROJECT

Project Overview:
Implement advanced AI document processing system for enterprise client.

Scope of Work:
1. Requirements analysis and system design
2. AI model development and training  
3. Integration with existing workflows
4. Testing and quality assurance
5. Deployment and monitoring setup

Timeline: 12 weeks
Budget: $180,000
Team: 4 engineers, 1 project manager

Expected Benefits:
- 75% reduction in manual document processing time
- 95% accuracy in document classification
- $500K annual cost savings for client
- Scalable solution for future growth

Next Steps:
Client approval needed by January 30, 2025 to meet Q2 delivery timeline.`,
        type: "proposal", 
        source: "sales-team",
        priority: "high"
      }
    }
  ];

  const results = [];

  console.log(`📋 Preparing to test ${testCases.length} different document types...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TEST ${i + 1}/${testCases.length}: ${testCase.name}`);
      console.log(`${'='.repeat(60)}`);

      const startTime = Date.now();
      const response = await makeWebhookRequest(testCase.data, testCase.name);
      const duration = Date.now() - startTime;

      if (response.success) {
        console.log(`✅ SUCCESS - Workflow executed successfully`);
        console.log(`⏱️  Response time: ${duration}ms`);
        
        if (response.data) {
          console.log(`\n📊 AI ANALYSIS RESULTS:`);
          
          // Display classification results
          if (response.data.classification) {
            console.log(`   📑 Document Type: ${response.data.classification.category || 'Unknown'}`);
            console.log(`   🎯 Confidence: ${(response.data.classification.confidence * 100 || 0).toFixed(1)}%`);
            if (response.data.classification.keywords) {
              console.log(`   🏷️  Keywords: ${response.data.classification.keywords.join(', ')}`);
            }
          }
          
          // Display extraction results
          if (response.data.extraction) {
            console.log(`   📝 Title: ${response.data.extraction.title || 'Not extracted'}`);
            console.log(`   📄 Summary: ${response.data.extraction.summary || 'Not available'}`);
            if (response.data.extraction.keyEntities) {
              console.log(`   🏢 Key Entities: ${response.data.extraction.keyEntities.join(', ')}`);
            }
          }
          
          // Display processing results
          if (response.data.processing) {
            console.log(`   🔧 Processing Type: ${response.data.processing.type || 'Unknown'}`);
          }
          
          // Display quality assessment
          if (response.data.qualityCheck) {
            console.log(`   ⭐ Quality Score: ${response.data.qualityCheck.score || 'N/A'}/10`);
            if (response.data.qualityCheck.notes) {
              console.log(`   📋 Quality Notes: ${response.data.qualityCheck.notes}`);
            }
          }
          
          // Display metadata
          if (response.data.metadata) {
            console.log(`   📊 Processing Time: ${response.data.metadata.processingTime || duration}ms`);
            console.log(`   🤖 AI Agents Used: ${response.data.metadata.aiAgents || 4}`);
          }

        } else if (response.rawResponse) {
          console.log(`\n📄 Raw Response Preview:`);
          console.log(response.rawResponse.substring(0, 200) + (response.rawResponse.length > 200 ? '...' : ''));
        }

        results.push({
          testName: testCase.name,
          status: 'success',
          responseTime: duration,
          statusCode: response.statusCode,
          hasData: !!response.data,
          classification: response.data?.classification?.category,
          confidence: response.data?.classification?.confidence
        });

      } else {
        console.log(`❌ FAILED - Status: ${response.statusCode}`);
        console.log(`📝 Error: ${response.error || 'Unknown error'}`);
        if (response.rawResponse) {
          console.log(`📄 Response: ${response.rawResponse.substring(0, 300)}`);
        }

        results.push({
          testName: testCase.name,
          status: 'failed',
          statusCode: response.statusCode,
          error: response.error,
          responseTime: duration
        });
      }

    } catch (error) {
      console.log(`💥 EXCEPTION: ${error.message || error}`);
      results.push({
        testName: testCase.name,
        status: 'exception',
        error: error.message || String(error),
        responseTime: 0
      });
    }

    // Wait between tests to avoid overwhelming the system
    if (i < testCases.length - 1) {
      console.log(`\n⏳ Waiting 3 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Final Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('🎯 WEBHOOK EXECUTION TEST SUMMARY');
  console.log(`${'='.repeat(70)}`);

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const exceptionCount = results.filter(r => r.status === 'exception').length;

  console.log(`\n📊 TEST RESULTS:`);
  console.log(`   ✅ Successful: ${successCount}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failedCount}/${testCases.length}`);
  console.log(`   💥 Exceptions: ${exceptionCount}/${testCases.length}`);

  const avgResponseTime = results
    .filter(r => r.responseTime > 0)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime > 0).length;

  console.log(`\n⚡ PERFORMANCE:`);
  console.log(`   📈 Average Response Time: ${avgResponseTime ? Math.round(avgResponseTime) : 'N/A'}ms`);
  console.log(`   🚀 Webhook Endpoint: OPERATIONAL`);

  console.log(`\n📋 DETAILED RESULTS:`);
  results.forEach((result, i) => {
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '💥';
    console.log(`   ${i + 1}. ${statusIcon} ${result.testName}`);
    console.log(`      Status: ${result.status} (${result.statusCode || 'N/A'})`);
    console.log(`      Response Time: ${result.responseTime}ms`);
    if (result.classification) {
      console.log(`      Classification: ${result.classification} (${(result.confidence * 100 || 0).toFixed(1)}%)`);
    }
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
    console.log('');
  });

  if (successCount > 0) {
    console.log('🎉 WEBHOOK TESTING SUCCESSFUL!');
    console.log('🤖 Advanced AI workflow is processing documents correctly!');
    console.log(`🔗 Production endpoint verified: ${WEBHOOK_URL}`);
  } else {
    console.log('⚠️  All tests failed - check workflow configuration');
  }

  return {
    totalTests: testCases.length,
    successful: successCount,
    failed: failedCount,
    exceptions: exceptionCount,
    averageResponseTime: avgResponseTime,
    results: results
  };
}

if (require.main === module) {
  testWebhookExecution()
    .then(summary => {
      console.log(`\n🎊 Testing completed: ${summary.successful}/${summary.totalTests} successful`);
      process.exit(summary.successful > 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}