#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

class WorkflowBenchmark {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.metrics = {
      latency: [],
      throughput: [],
      errorRate: [],
      resourceUsage: []
    };
  }

  async stressTest(endpoint, payload, options = {}) {
    const {
      concurrent = 10,
      iterations = 100,
      rampUp = 5000
    } = options;

    console.log(chalk.yellow(`\\nStress Testing: ${endpoint}`));
    console.log(chalk.gray(`Concurrent: ${concurrent}, Iterations: ${iterations}`));

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const batch = [];
      
      for (let j = 0; j < concurrent; j++) {
        batch.push(this.makeRequest(endpoint, payload));
      }

      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);

      // Ramp up delay
      if (i < 5) {
        await this.delay(rampUp / (i + 1));
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(chalk.gray('.'));
      }
    }

    const duration = Date.now() - startTime;
    return this.analyzeResults(results, duration);
  }

  async makeRequest(endpoint, payload) {
    const start = Date.now();
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/webhook/${endpoint}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        latency: Date.now() - start,
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
        error: error.message
      };
    }
  }

  analyzeResults(results, totalDuration) {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);

    const latencies = successful.map(r => r.value.latency).sort((a, b) => a - b);
    
    const metrics = {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      errorRate: (failed.length / results.length * 100).toFixed(2) + '%',
      throughput: (results.length / (totalDuration / 1000)).toFixed(2) + ' req/s',
      avgLatency: (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) + 'ms',
      p50Latency: latencies[Math.floor(latencies.length * 0.5)] + 'ms',
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] + 'ms',
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] + 'ms',
      minLatency: Math.min(...latencies) + 'ms',
      maxLatency: Math.max(...latencies) + 'ms'
    };

    return metrics;
  }

  async runBenchmarks() {
    console.log(chalk.bold.cyan('\\n🏃 Starting Workflow Benchmarks\\n'));

    const testPayload = {
      query: "Test query for benchmarking",
      context: { test: true }
    };

    // Benchmark different scenarios
    const scenarios = [
      { name: 'Light Load', concurrent: 5, iterations: 50 },
      { name: 'Medium Load', concurrent: 20, iterations: 100 },
      { name: 'Heavy Load', concurrent: 50, iterations: 200 }
    ];

    const results = {};

    for (const scenario of scenarios) {
      console.log(chalk.bold(`\\n📈 ${scenario.name} Scenario`));
      
      results[scenario.name] = await this.stressTest(
        'customer-support',
        testPayload,
        scenario
      );

      this.printMetrics(results[scenario.name]);
      await this.delay(5000); // Cool down between scenarios
    }

    this.saveReport(results);
  }

  printMetrics(metrics) {
    console.log(chalk.green('\\n✅ Benchmark Results:'));
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(chalk.white(`  ${key}: `) + chalk.yellow(value));
    });
  }

  saveReport(results) {
    const reportPath = path.join(
      __dirname,
      '../data/output',
      `benchmark-${Date.now()}.json`
    );

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log(chalk.gray(`\\n📁 Report saved to: ${reportPath}`));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run benchmarks
if (require.main === module) {
  const benchmark = new WorkflowBenchmark();
  benchmark.runBenchmarks().catch(console.error);
}

module.exports = WorkflowBenchmark;