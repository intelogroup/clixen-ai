#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const mcpDbPath = path.join(__dirname, '../node_modules/n8n-mcp/data/nodes.db');

try {
  const db = new Database(mcpDbPath, { readonly: true });
  
  console.log('Database tables:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  console.log('\nSchema for main table:');
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all();
  schema.forEach(s => {
    console.log(s.sql);
  });
  
  console.log('\nSample records:');
  const sample = db.prepare("SELECT node_type, display_name, description, category FROM nodes LIMIT 5").all();
  console.log(sample);
  
  console.log('\nSearch for email nodes:');
  const emailNodes = db.prepare("SELECT node_type, display_name, description FROM nodes WHERE LOWER(display_name) LIKE '%email%' OR LOWER(description) LIKE '%email%' LIMIT 5").all();
  console.log(emailNodes);
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}