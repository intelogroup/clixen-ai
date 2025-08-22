#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class WorkflowValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validateWorkflowStructure(workflow, filePath) {
    const fileName = path.basename(filePath);
    
    // Check required fields
    if (!workflow.name) {
      this.errors.push(`${fileName}: Missing workflow name`);
    }
    
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      this.errors.push(`${fileName}: Missing or invalid nodes array`);
    }
    
    if (!workflow.connections || typeof workflow.connections !== 'object') {
      this.errors.push(`${fileName}: Missing or invalid connections object`);
    }

    // Validate nodes
    if (workflow.nodes) {
      workflow.nodes.forEach((node, index) => {
        if (!node.id) {
          this.errors.push(`${fileName}: Node at index ${index} missing ID`);
        }
        if (!node.type) {
          this.errors.push(`${fileName}: Node ${node.id || index} missing type`);
        }
        if (!node.position || !Array.isArray(node.position)) {
          this.warnings.push(`${fileName}: Node ${node.id || index} missing position`);
        }
      });
    }

    // Validate connections
    if (workflow.connections) {
      Object.keys(workflow.connections).forEach(nodeId => {
        const nodeExists = workflow.nodes?.some(n => n.id === nodeId);
        if (!nodeExists) {
          this.errors.push(`${fileName}: Connection references non-existent node: ${nodeId}`);
        }
      });
    }

    // Check for agent nodes
    const agentNodes = workflow.nodes?.filter(n => n.type?.includes('agent')) || [];
    if (agentNodes.length === 0) {
      this.warnings.push(`${fileName}: No agent nodes found in workflow`);
    }

    return this.errors.length === 0;
  }

  validateAllWorkflows() {
    console.log(chalk.bold.cyan('\\n🔍 Validating N8N Workflows\\n'));

    const workflowDir = path.join(__dirname, '../workflows/core');
    const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.json'));

    let validCount = 0;
    let invalidCount = 0;

    files.forEach(file => {
      const filePath = path.join(workflowDir, file);
      console.log(chalk.blue(`Validating: ${file}`));

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const workflow = JSON.parse(content);
        
        if (this.validateWorkflowStructure(workflow, filePath)) {
          console.log(chalk.green('  ✓ Valid'));
          validCount++;
        } else {
          console.log(chalk.red('  ✗ Invalid'));
          invalidCount++;
        }
      } catch (error) {
        this.errors.push(`${file}: ${error.message}`);
        console.log(chalk.red(`  ✗ Parse error: ${error.message}`));
        invalidCount++;
      }
    });

    // Print summary
    console.log(chalk.bold.cyan('\\n📊 Validation Summary\\n'));
    console.log(chalk.green(`Valid workflows: ${validCount}`));
    console.log(chalk.red(`Invalid workflows: ${invalidCount}`));

    if (this.errors.length > 0) {
      console.log(chalk.red('\\n❌ Errors:'));
      this.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\\n⚠️  Warnings:'));
      this.warnings.forEach(warn => console.log(chalk.yellow(`  - ${warn}`)));
    }

    return invalidCount === 0;
  }
}

// Run validation
if (require.main === module) {
  const validator = new WorkflowValidator();
  const isValid = validator.validateAllWorkflows();
  process.exit(isValid ? 0 : 1);
}

module.exports = WorkflowValidator;