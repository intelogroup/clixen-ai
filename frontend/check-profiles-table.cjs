#!/usr/bin/env node

/**
 * Check current profiles table structure
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function checkProfilesTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Checking current profiles table structure...\n');

    // Check if profiles table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      ) as exists
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Profiles table does not exist!');
      return;
    }

    // Get current columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    console.log('📋 Current profiles table columns:');
    columns.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Check constraints
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
    `);

    console.log('\n🔒 Current constraints:');
    constraints.rows.forEach(row => {
      console.log(`   - ${row.constraint_name} (${row.constraint_type})`);
    });

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'profiles'
      AND schemaname = 'public'
    `);

    console.log('\n📊 Current indexes:');
    indexes.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkProfilesTable().catch(console.error);