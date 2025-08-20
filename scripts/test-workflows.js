#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

class WorkflowTester {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.results = [];
  }

  async loadTestData() {
    const mockDataPath = path.join(__dirname, '../data/mocks/sample-requests.json');
    return JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
  }

  async testWorkflow(workflowName, endpoint, testData) {
    console.log(chalk.blue(`\nTesting workflow: ${workflowName}`));
    console.log(chalk.gray(`Endpoint: ${endpoint}`));
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/webhook/${endpoint}`,
        testData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: parseInt(process.env.TIMEOUT_MS) || 30000
        }
      );
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        workflow: workflowName,
        status: 'success',
        duration,
        response: response.data
      });
      
      console.log(chalk.green(`✓ Success (${duration}ms)`));
      return { success: true, duration, data: response.data };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        workflow: workflowName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      console.log(chalk.red(`✗ Failed (${duration}ms): ${error.message}`));
      return { success: false, duration, error: error.message };
    }
  }

  async runTests() {
    console.log(chalk.bold.cyan('\\n🚀 Starting N8N Workflow Tests\\n'));
    
    const testData = await this.loadTestData();
    
    // Test Customer Support Agent
    for (const test of testData.customer_support) {
      await this.testWorkflow(
        'Customer Support Agent',
        'customer-support',
        test
      );
      await this.delay(1000); // Rate limiting
    }
    
    // Test Content Generation Agent
    for (const test of testData.content_generation) {
      await this.testWorkflow(
        'Content Generation Agent',
        'generate-content',
        test
      );
      await this.delay(1000);
    }
    
    this.generateReport();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    console.log(chalk.bold.cyan('\\n📊 Test Results Summary\\n'));
    
    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    
    console.log(chalk.green(`Successful: ${successful}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.yellow(`Average Duration: ${avgDuration.toFixed(2)}ms`));
    
    // Save detailed report
    const reportPath = path.join(__dirname, '../data/output/test-report-' + Date.now() + '.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(chalk.gray(`\\nDetailed report saved to: ${reportPath}`));
  }
}

// Run tests
if (require.main === module) {
  const tester = new WorkflowTester();
  tester.runTests().catch(console.error);
}

module.exports = WorkflowTester;