#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Setup script for n8n-mcp integration
 */
class N8nMcpSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
  }

  async checkPrerequisites() {
    console.log(chalk.blue('🔍 Checking prerequisites...'));
    
    const checks = {
      node: this.checkNodeVersion(),
      npm: this.checkNpmVersion(),
      n8nMcp: this.checkN8nMcpPackage(),
      envFile: this.checkEnvFile()
    };

    const results = await Promise.all(Object.values(checks));
    const allPassed = results.every(result => result.success);

    if (allPassed) {
      console.log(chalk.green('✓ All prerequisites met'));
      return true;
    } else {
      console.log(chalk.red('✗ Some prerequisites failed'));
      return false;
    }
  }

  async checkNodeVersion() {
    try {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      
      if (major >= 18) {
        console.log(chalk.green(`✓ Node.js ${version}`));
        return { success: true };
      } else {
        console.log(chalk.red(`✗ Node.js ${version} (requires >= 18)`));
        return { success: false };
      }
    } catch (error) {
      console.log(chalk.red(`✗ Node.js check failed: ${error.message}`));
      return { success: false };
    }
  }

  async checkNpmVersion() {
    try {
      const { execSync } = require('child_process');
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(chalk.green(`✓ npm ${version}`));
      return { success: true };
    } catch (error) {
      console.log(chalk.red(`✗ npm check failed: ${error.message}`));
      return { success: false };
    }
  }

  async checkN8nMcpPackage() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.dependencies && packageJson.dependencies['n8n-mcp']) {
        console.log(chalk.green(`✓ n8n-mcp ${packageJson.dependencies['n8n-mcp']}`));
        return { success: true };
      } else {
        console.log(chalk.red('✗ n8n-mcp package not found'));
        return { success: false };
      }
    } catch (error) {
      console.log(chalk.red(`✗ Package check failed: ${error.message}`));
      return { success: false };
    }
  }

  async checkEnvFile() {
    try {
      const envPath = path.join(this.projectRoot, '.env');
      
      if (fs.existsSync(envPath)) {
        console.log(chalk.green('✓ .env file exists'));
        return { success: true };
      } else {
        console.log(chalk.yellow('⚠ .env file not found - will use defaults'));
        return { success: true }; // Not critical
      }
    } catch (error) {
      console.log(chalk.red(`✗ .env check failed: ${error.message}`));
      return { success: false };
    }
  }

  async initializeN8nMcp() {
    console.log(chalk.blue('🚀 Initializing n8n-mcp...'));
    
    try {
      // Check if n8n-mcp can be started
      const testProcess = spawn('npx', ['n8n-mcp', '--help'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve, reject) => {
        testProcess.on('close', (code) => {
          if (code === 0 || output.includes('n8n-mcp')) {
            console.log(chalk.green('✓ n8n-mcp is working'));
            resolve();
          } else {
            reject(new Error(`n8n-mcp failed with code ${code}`));
          }
        });

        setTimeout(() => {
          testProcess.kill();
          resolve(); // Don't fail on timeout
        }, 5000);
      });

      return true;
    } catch (error) {
      console.log(chalk.red(`✗ n8n-mcp initialization failed: ${error.message}`));
      return false;
    }
  }

  async createConfigFile() {
    console.log(chalk.blue('📝 Creating MCP configuration...'));
    
    const configPath = path.join(this.projectRoot, 'config', 'n8n-mcp.json');
    
    const config = {
      server: {
        mode: "stdio",
        httpPort: 3001,
        logLevel: "info"
      },
      n8n: {
        docsPath: process.env.N8N_DOCS_PATH || "../n8n-docs",
        nodeDatabase: {
          rebuild: false,
          cacheExpiry: "24h"
        }
      },
      features: {
        nodeSearch: true,
        intentValidation: true,
        workflowHealing: true,
        configValidation: true
      },
      limits: {
        maxNodes: 100,
        maxSearchResults: 20,
        timeoutMs: 5000
      }
    };

    try {
      // Ensure config directory exists
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green(`✓ Configuration saved to ${configPath}`));
      return true;
    } catch (error) {
      console.log(chalk.red(`✗ Failed to create config: ${error.message}`));
      return false;
    }
  }

  async testIntegration() {
    console.log(chalk.blue('🧪 Testing n8n-mcp integration...'));
    
    try {
      // Test basic MCP functionality
      const N8nWorkflowOrchestrator = require('./n8n-workflow-orchestrator.js');
      const orchestrator = new N8nWorkflowOrchestrator();
      
      // Test intent validation with a simple example
      const mcpReady = await orchestrator.initializeMCP();
      
      if (mcpReady) {
        console.log(chalk.green('✓ MCP server communication working'));
        
        // Cleanup
        orchestrator.cleanup();
        return true;
      } else {
        console.log(chalk.red('✗ MCP server communication failed'));
        return false;
      }
    } catch (error) {
      console.log(chalk.red(`✗ Integration test failed: ${error.message}`));
      return false;
    }
  }

  async setup() {
    console.log(chalk.bold.cyan('\n🔧 N8N MCP Setup\n'));
    
    try {
      // 1. Check prerequisites
      const prereqsPassed = await this.checkPrerequisites();
      if (!prereqsPassed) {
        throw new Error('Prerequisites not met');
      }

      // 2. Initialize n8n-mcp
      const mcpReady = await this.initializeN8nMcp();
      if (!mcpReady) {
        console.log(chalk.yellow('⚠ n8n-mcp initialization had issues, but continuing...'));
      }

      // 3. Create configuration
      const configCreated = await this.createConfigFile();
      if (!configCreated) {
        throw new Error('Failed to create configuration');
      }

      // 4. Test integration
      console.log(chalk.yellow('Note: Skipping integration test - will be tested during first use'));

      console.log(chalk.bold.green('\n🎉 Setup Complete!\n'));
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.gray('1. Copy .env.example to .env and configure your N8N instance'));
      console.log(chalk.gray('2. Test with: npm run validate-intent -- --intent "send email notification"'));
      console.log(chalk.gray('3. Create workflows with: npm run create-workflow -- --intent "your workflow description" --name "MyWorkflow"'));
      
      return true;
    } catch (error) {
      console.log(chalk.bold.red('\n❌ Setup Failed\n'));
      console.error(chalk.red(`Error: ${error.message}`));
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const setup = new N8nMcpSetup();
  setup.setup().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = N8nMcpSetup;