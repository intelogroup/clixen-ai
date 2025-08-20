#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

class WorkflowExporter {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = `${this.baseUrl}/api/v1`;
  }

  async getAllWorkflows() {
    try {
      const response = await axios.get(`${this.apiUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.log(chalk.red(`Failed to fetch workflows: ${error.message}`));
      return [];
    }
  }

  async getWorkflowDetails(workflowId) {
    try {
      const response = await axios.get(`${this.apiUrl}/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      console.log(chalk.red(`Failed to fetch workflow ${workflowId}: ${error.message}`));
      return null;
    }
  }

  async exportWorkflow(workflowId, outputDir) {
    const workflow = await this.getWorkflowDetails(workflowId);
    if (!workflow) return false;

    const fileName = `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const filePath = path.join(outputDir, fileName);

    // Clean up workflow data for export
    const exportData = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || null,
      tags: workflow.tags || []
    };

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    console.log(chalk.green(`  ✓ Exported: ${fileName}`));
    return true;
  }

  async exportAll() {
    console.log(chalk.bold.cyan('\n📥 Exporting Workflows from N8N Cloud\n'));
    console.log(chalk.gray(`Instance: ${this.baseUrl}`));

    const workflows = await this.getAllWorkflows();
    if (workflows.length === 0) {
      console.log(chalk.yellow('No workflows found to export'));
      return;
    }

    const outputDir = path.join(__dirname, '../workflows/exported');
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(chalk.blue(`Found ${workflows.length} workflows\n`));

    let successCount = 0;
    for (const workflow of workflows) {
      console.log(chalk.blue(`Exporting: ${workflow.name} (ID: ${workflow.id})`));
      const success = await this.exportWorkflow(workflow.id, outputDir);
      if (success) successCount++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(chalk.bold.cyan('\n📊 Export Summary\n'));
    console.log(chalk.green(`✓ Exported: ${successCount}/${workflows.length} workflows`));
    console.log(chalk.gray(`📁 Location: ${outputDir}`));
  }

  async exportSingle(workflowId) {
    const outputDir = path.join(__dirname, '../workflows/exported');
    fs.mkdirSync(outputDir, { recursive: true });
    
    console.log(chalk.blue(`Exporting workflow ID: ${workflowId}`));
    await this.exportWorkflow(workflowId, outputDir);
  }
}

// CLI handling
if (require.main === module) {
  const exporter = new WorkflowExporter();
  const args = process.argv.slice(2);
  
  if (args[0]) {
    exporter.exportSingle(args[0]).catch(console.error);
  } else {
    exporter.exportAll().catch(console.error);
  }
}

module.exports = WorkflowExporter;