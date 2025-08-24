#!/usr/bin/env node

/**
 * RefMCP Server Test Script
 * Tests RefMCP server installation and basic functionality
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

async function testRefMCPInstallation() {
  console.log('🚀 Testing RefMCP Server Installation...\n');

  // Test 1: Check if ref-tools-mcp is available
  console.log('1. Checking ref-tools-mcp availability...');
  try {
    const testProcess = spawn('npx', ['ref-tools-mcp@latest', '--version'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    await new Promise((resolve) => {
      testProcess.on('close', (code) => {
        if (code === 0 || output.includes('ref-tools')) {
          console.log('✅ ref-tools-mcp is available');
        } else {
          console.log('❌ ref-tools-mcp is not properly installed');
          console.log('Output:', output);
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ Error checking ref-tools-mcp:', error.message);
  }

  // Test 2: Check MCP configuration file
  console.log('\n2. Checking MCP configuration...');
  try {
    const mcpConfig = JSON.parse(readFileSync('.mcp.json', 'utf8'));
    if (mcpConfig.mcpServers && mcpConfig.mcpServers['ref-tools']) {
      console.log('✅ MCP configuration file exists and has ref-tools server');
    } else {
      console.log('❌ MCP configuration file missing ref-tools server');
    }
  } catch (error) {
    console.log('❌ Error reading MCP configuration:', error.message);
  }

  // Test 3: Environment variables check
  console.log('\n3. Checking environment variables...');
  const envPath = '.env.local';
  try {
    const envContent = readFileSync(envPath, 'utf8');
    if (envContent.includes('REF_API_KEY')) {
      console.log('✅ REF_API_KEY found in environment');
    } else {
      console.log('⚠️  REF_API_KEY not found in .env.local');
      console.log('   Please add: REF_API_KEY=your_actual_api_key');
    }
  } catch (error) {
    console.log('⚠️  .env.local not found - please create it from env.example');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Get your RefMCP API key from: https://ref.tools/');
  console.log('2. Add REF_API_KEY to your .env.local file');
  console.log('3. Configure your AI client (Cursor, VSCode, etc.) to use the MCP server');
  console.log('4. Test documentation search with Next.js and Supabase queries');

  console.log('\n🔧 MCP Configuration Location:');
  console.log(`   File: ${join(process.cwd(), '.mcp.json')}`);
  console.log('   This file configures which MCP servers your AI client can use');

  console.log('\n📚 Available Documentation Sources:');
  console.log('   - Next.js official documentation');
  console.log('   - Supabase documentation and guides');
  console.log('   - 1000+ other technical documentation sites');
  console.log('   - Token-efficient search to reduce costs');
}

// Run the test
testRefMCPInstallation().catch(console.error);