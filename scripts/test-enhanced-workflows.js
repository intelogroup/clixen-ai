#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EnhancedWorkflowTester {
  constructor() {
    this.webhookBase = process.env.N8N_WEBHOOK_URL;
    this.results = [];
  }

  async loadEnhancedTestData() {
    const dataPath = path.join(__dirname, '../data/mocks/enhanced-test-requests.json');
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  async testMultiToolAgent() {
    console.log(chalk.bold.cyan('\n🔧 Testing Enhanced Multi-Tool Agent\n'));
    
    const testData = await this.loadEnhancedTestData();
    
    for (const test of testData.multi_tool_agent) {
      console.log(chalk.blue(`\nTesting: ${test.id}`));
      console.log(chalk.gray(`Query: ${test.query}`));
      console.log(chalk.gray(`Expected tools: ${test.expected_tools.join(', ')}`));
      
      const result = await this.makeRequest('multi-tool-agent', { query: test.query });
      
      if (result.success) {
        console.log(chalk.green(`✓ Success (${result.duration}ms)`));
        console.log(chalk.gray(`Response length: ${JSON.stringify(result.data).length} chars`));
      } else {
        console.log(chalk.red(`✗ Failed: ${result.error}`));
      }
      
      this.results.push({
        workflow: 'multi-tool-agent',
        test_id: test.id,
        ...result
      });
      
      await this.delay(3000); // Longer delay for complex workflows
    }
  }

  async testResearchAnalyst() {
    console.log(chalk.bold.cyan('\n🔬 Testing AI Research Analyst\n'));
    
    const testData = await this.loadEnhancedTestData();
    
    for (const test of testData.research_analyst) {
      console.log(chalk.blue(`\nTesting: ${test.id}`));
      console.log(chalk.gray(`Topic: ${test.topic}`));
      console.log(chalk.gray(`Depth: ${test.depth}`));
      
      const result = await this.makeRequest('research-analyst', {
        topic: test.topic,
        depth: test.depth,
        focus_areas: test.focus_areas
      });
      
      if (result.success) {
        console.log(chalk.green(`✓ Success (${result.duration}ms)`));
        if (result.data?.final_report) {
          console.log(chalk.gray(`Report length: ${result.data.final_report.length} chars`));
          console.log(chalk.gray(`Models used: ${result.data.models_used?.join(', ') || 'Unknown'}`));
        }
      } else {
        console.log(chalk.red(`✗ Failed: ${result.error}`));
      }
      
      this.results.push({
        workflow: 'research-analyst',
        test_id: test.id,
        ...result
      });
      
      await this.delay(5000); // Even longer delay for research workflows
    }
  }

  async makeRequest(endpoint, payload) {
    const url = `${this.webhookBase}/${endpoint}`;
    const startTime = Date.now();
    
    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000 // 2 minute timeout for complex workflows
      });

      return {
        success: true,
        duration: Date.now() - startTime,
        statusCode: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        statusCode: error.response?.status
      };
    }
  }

  async testToolConnectivity() {
    console.log(chalk.bold.cyan('\n🔌 Testing Tool Connectivity\n'));
    
    const tools = [
      {
        name: 'OpenWeather API',
        test: () => axios.get(`http://api.openweathermap.org/data/2.5/weather?q=London&appid=${process.env.OPENWEATHER_API_KEY}`)
      },
      {
        name: 'Firecrawl API',
        test: () => axios.post('https://api.firecrawl.dev/v0/scrape', 
          { url: 'https://example.com' },
          { headers: { 'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}` }}
        )
      },
      {
        name: 'DeepSeek API',
        test: () => axios.post('https://api.deepseek.com/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
          },
          { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }}
        )
      },
      {
        name: 'Google AI API',
        test: () => axios.post(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
          {
            contents: [{ parts: [{ text: 'Hello' }] }],
            generationConfig: { maxOutputTokens: 10 }
          }
        )
      }
    ];

    for (const tool of tools) {
      try {
        console.log(chalk.blue(`Testing ${tool.name}...`));
        await tool.test();
        console.log(chalk.green(`✓ ${tool.name} - Connected`));
      } catch (error) {
        console.log(chalk.red(`✗ ${tool.name} - Failed: ${error.message}`));
      }
    }
  }

  async runPerformanceBenchmark() {
    console.log(chalk.bold.cyan('\n⚡ Performance Benchmark\n'));
    
    const simplePayload = { query: "What is AI?" };
    const results = [];
    
    console.log(chalk.blue('Running 10 concurrent requests to multi-tool-agent...'));
    
    const promises = Array(10).fill().map((_, i) => 
      this.makeRequest('multi-tool-agent', {
        ...simplePayload,
        request_id: i
      })
    );
    
    const responses = await Promise.allSettled(promises);
    
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = responses.filter(r => r.status === 'rejected' || !r.value?.success);
    
    const latencies = successful.map(r => r.value.duration);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    
    console.log(chalk.green(`✓ Successful requests: ${successful.length}/10`));
    console.log(chalk.red(`✗ Failed requests: ${failed.length}/10`));
    console.log(chalk.yellow(`📊 Average latency: ${avgLatency.toFixed(2)}ms`));
    console.log(chalk.yellow(`📊 Min latency: ${Math.min(...latencies)}ms`));
    console.log(chalk.yellow(`📊 Max latency: ${Math.max(...latencies)}ms`));
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const reportPath = path.join(__dirname, '../data/output', `enhanced-workflow-test-${Date.now()}.json`);
    
    const report = {
      timestamp,
      summary: {
        total_tests: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        average_duration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
      },
      results: this.results,
      environment: {
        n8n_instance: process.env.N8N_BASE_URL,
        tools_configured: [
          'OpenAI GPT-4',
          'DeepSeek',
          'Google Gemini',
          'OpenWeather',
          'Firecrawl',
          'Apify'
        ]
      }
    };
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(chalk.bold.cyan('\n📊 Test Report Summary\n'));
    console.log(chalk.green(`Total Tests: ${report.summary.total_tests}`));
    console.log(chalk.green(`Successful: ${report.summary.successful}`));
    console.log(chalk.red(`Failed: ${report.summary.failed}`));
    console.log(chalk.yellow(`Average Duration: ${report.summary.average_duration.toFixed(2)}ms`));
    console.log(chalk.gray(`\nDetailed report saved to: ${reportPath}`));
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllTests() {
    console.log(chalk.bold.cyan('🚀 Enhanced N8N Workflow Testing Suite\n'));
    
    await this.testToolConnectivity();
    await this.testMultiToolAgent();
    await this.testResearchAnalyst();
    await this.runPerformanceBenchmark();
    await this.generateReport();
    
    console.log(chalk.bold.green('\n✅ All enhanced workflow tests completed!'));
  }
}

// CLI
if (require.main === module) {
  const tester = new EnhancedWorkflowTester();
  const args = process.argv.slice(2);
  
  switch(args[0]) {
    case 'connectivity':
      tester.testToolConnectivity().catch(console.error);
      break;
    case 'multi-tool':
      tester.testMultiToolAgent().catch(console.error);
      break;
    case 'research':
      tester.testResearchAnalyst().catch(console.error);
      break;
    case 'performance':
      tester.runPerformanceBenchmark().catch(console.error);
      break;
    default:
      tester.runAllTests().catch(console.error);
  }
}

module.exports = EnhancedWorkflowTester;