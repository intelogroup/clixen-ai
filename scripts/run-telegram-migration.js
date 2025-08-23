#!/usr/bin/env node

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

/**
 * Telegram Integration Database Migration Script
 * Extends the existing B2C platform with Telegram bot support
 */
class TelegramMigration {
  constructor() {
    this.connectionString = this.buildConnectionString();
    this.sql = null;
  }

  buildConnectionString() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const password = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;
    
    if (!supabaseUrl || !password) {
      console.log(chalk.red('Missing Supabase configuration'));
      console.log('Required environment variables:');
      console.log('- NEXT_PUBLIC_SUPABASE_URL');
      console.log('- SUPABASE_DB_PASSWORD or DATABASE_PASSWORD');
      process.exit(1);
    }

    // Extract project ID from Supabase URL
    const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    
    // Build pooled connection string (more reliable than direct)
    const connectionString = `postgresql://postgres.${projectId}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
    
    console.log(chalk.blue(`Connecting to Supabase project: ${projectId}`));
    return connectionString;
  }

  async connect() {
    try {
      this.sql = postgres(this.connectionString, {
        ssl: 'require',
        max: 1, // Single connection for migration
        idle_timeout: 20,
        connect_timeout: 10
      });

      // Test connection
      await this.sql`SELECT 1`;
      console.log(chalk.green('✓ Database connection established'));
      return true;
    } catch (error) {
      console.log(chalk.red('✗ Database connection failed:'), error.message);
      return false;
    }
  }

  async runMigration() {
    console.log(chalk.bold.cyan('\n🚀 Starting Telegram Integration Migration\n'));

    if (!(await this.connect())) {
      process.exit(1);
    }

    try {
      // Read migration SQL file
      const migrationPath = path.join(__dirname, 'supabase', 'telegram-integration.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      console.log(chalk.blue('📄 Loading migration file...'));
      console.log(chalk.gray(`File: ${migrationPath}`));
      console.log(chalk.gray(`Size: ${Math.round(migrationSQL.length / 1024)}KB`));

      // Split SQL into individual statements
      const statements = this.parseSQLStatements(migrationSQL);
      console.log(chalk.blue(`📝 Found ${statements.length} SQL statements\n`));

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement || statement.startsWith('--')) continue;

        try {
          const statementType = this.getStatementType(statement);
          process.stdout.write(chalk.gray(`[${i + 1}/${statements.length}] ${statementType}... `));

          await this.sql.unsafe(statement);
          
          console.log(chalk.green('✓'));
          successCount++;

        } catch (error) {
          if (this.isExpectedError(error, statement)) {
            console.log(chalk.yellow('⚠ (exists)'));
            skipCount++;
          } else {
            console.log(chalk.red('✗'));
            console.log(chalk.red(`   Error: ${error.message}`));
            errorCount++;
            
            if (this.isCriticalError(error)) {
              throw error;
            }
          }
        }
      }

      // Migration summary
      console.log(chalk.cyan('\n📊 Migration Summary:'));
      console.log(chalk.green(`  ✓ Successful: ${successCount}`));
      console.log(chalk.yellow(`  ⚠ Skipped: ${skipCount}`));
      console.log(chalk.red(`  ✗ Errors: ${errorCount}`));
      console.log(chalk.blue(`  📝 Total: ${statements.length}`));

      if (errorCount === 0) {
        console.log(chalk.bold.green('\n🎉 Telegram integration migration completed successfully!'));
        
        // Test the migration
        await this.testMigration();
      } else {
        console.log(chalk.bold.yellow('\n⚠️  Migration completed with some errors'));
      }

    } catch (error) {
      console.log(chalk.bold.red('\n💥 Migration failed:'), error.message);
      process.exit(1);
    } finally {
      if (this.sql) {
        await this.sql.end();
        console.log(chalk.gray('\n🔌 Database connection closed'));
      }
    }
  }

  parseSQLStatements(sql) {
    // Remove comments and normalize whitespace
    let cleaned = sql
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Split by semicolons, but be smart about function definitions
    const statements = [];
    let current = '';
    let inFunction = false;
    let depth = 0;

    const lines = cleaned.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      current += trimmed + '\n';

      // Track function/block depth
      if (trimmed.toLowerCase().includes('create') && 
          (trimmed.toLowerCase().includes('function') || trimmed.toLowerCase().includes('trigger'))) {
        inFunction = true;
      }

      // Count dollar signs for function bodies
      const dollarMatches = trimmed.match(/\$\$/g);
      if (dollarMatches) {
        depth += dollarMatches.length;
      }

      // End of statement
      if (trimmed.endsWith(';') && (!inFunction || depth % 2 === 0)) {
        statements.push(current.trim());
        current = '';
        inFunction = false;
        depth = 0;
      }
    }

    // Add any remaining content
    if (current.trim()) {
      statements.push(current.trim());
    }

    return statements.filter(stmt => stmt && !stmt.startsWith('--'));
  }

  getStatementType(statement) {
    const lower = statement.toLowerCase();
    if (lower.includes('create table')) return 'CREATE TABLE';
    if (lower.includes('create index')) return 'CREATE INDEX';
    if (lower.includes('create function')) return 'CREATE FUNCTION';
    if (lower.includes('create trigger')) return 'CREATE TRIGGER';
    if (lower.includes('create policy')) return 'CREATE POLICY';
    if (lower.includes('create view')) return 'CREATE VIEW';
    if (lower.includes('alter table')) return 'ALTER TABLE';
    if (lower.includes('insert into')) return 'INSERT DATA';
    if (lower.includes('update')) return 'UPDATE';
    if (lower.includes('grant')) return 'GRANT';
    return 'SQL STATEMENT';
  }

  isExpectedError(error, statement) {
    const message = error.message.toLowerCase();
    const stmt = statement.toLowerCase();

    return (
      message.includes('already exists') ||
      message.includes('duplicate key') ||
      (message.includes('relation') && message.includes('does not exist') && stmt.includes('drop')) ||
      message.includes('column already exists') ||
      message.includes('constraint already exists')
    );
  }

  isCriticalError(error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('syntax error') ||
      message.includes('permission denied') ||
      message.includes('connection') ||
      message.includes('authentication')
    );
  }

  async testMigration() {
    try {
      console.log(chalk.blue('\n🧪 Testing migration...'));

      // Test table creation
      const tables = [
        'telegram_accounts',
        'payment_sessions', 
        'workflow_usage',
        'user_credits',
        'workflow_templates',
        'user_workflow_subscriptions',
        'telegram_interactions'
      ];

      for (const table of tables) {
        try {
          await this.sql`SELECT COUNT(*) FROM ${this.sql(table)}`;
          console.log(chalk.green(`  ✓ Table ${table} accessible`));
        } catch (error) {
          console.log(chalk.red(`  ✗ Table ${table} not accessible: ${error.message}`));
        }
      }

      // Test functions
      const functions = [
        'consume_user_credits',
        'reset_monthly_credits',
        'get_user_credit_balance'
      ];

      for (const func of functions) {
        try {
          await this.sql`SELECT proname FROM pg_proc WHERE proname = ${func}`;
          console.log(chalk.green(`  ✓ Function ${func} created`));
        } catch (error) {
          console.log(chalk.red(`  ✗ Function ${func} not found: ${error.message}`));
        }
      }

      // Test views
      const views = ['user_dashboard', 'workflow_analytics'];
      for (const view of views) {
        try {
          await this.sql`SELECT COUNT(*) FROM ${this.sql(view)}`;
          console.log(chalk.green(`  ✓ View ${view} accessible`));
        } catch (error) {
          console.log(chalk.red(`  ✗ View ${view} not accessible: ${error.message}`));
        }
      }

      console.log(chalk.green('\n✅ Migration test completed'));

    } catch (error) {
      console.log(chalk.red('\n❌ Migration test failed:'), error.message);
    }
  }
}

// Run migration
if (require.main === module) {
  const migration = new TelegramMigration();
  migration.runMigration().catch(console.error);
}

module.exports = TelegramMigration;