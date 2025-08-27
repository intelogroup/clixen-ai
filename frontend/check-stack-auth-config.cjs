// Load environment variables
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const { PrismaClient } = require('@prisma/client');

/**
 * Stack Auth Configuration Checker
 * Verifies all authentication components are properly configured
 */

class StackAuthChecker {
  constructor() {
    this.results = {
      env: { passed: 0, failed: 0, details: [] },
      api: { passed: 0, failed: 0, details: [] },
      database: { passed: 0, failed: 0, details: [] },
      overall: 'pending'
    };
  }

  log(category, status, message, data = null) {
    const entry = { status, message, data, timestamp: new Date().toISOString() };
    this.results[category].details.push(entry);
    
    if (status === 'pass') {
      this.results[category].passed++;
      console.log(`✅ ${category.toUpperCase()}: ${message}`);
    } else if (status === 'fail') {
      this.results[category].failed++;
      console.log(`❌ ${category.toUpperCase()}: ${message}`);
    } else {
      console.log(`ℹ️  ${category.toUpperCase()}: ${message}`);
    }
    
    if (data) {
      console.log(`   Details: ${JSON.stringify(data, null, 2)}`);
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n🔍 Checking Environment Variables...');
    
    const requiredVars = {
      'NEXT_PUBLIC_STACK_PROJECT_ID': process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
      'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY': process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
      'STACK_SECRET_SERVER_KEY': process.env.STACK_SECRET_SERVER_KEY,
      'DATABASE_URL': process.env.DATABASE_URL
    };

    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value) {
        this.log('env', 'fail', `Missing required variable: ${key}`);
      } else if (value.includes('placeholder') || value.includes('your-') || value.includes('example')) {
        this.log('env', 'fail', `Placeholder value detected: ${key}`, { value: value.substring(0, 20) + '...' });
      } else {
        this.log('env', 'pass', `Valid ${key}`, { 
          length: value.length,
          prefix: value.substring(0, 8) + '...'
        });
      }
    }

    // Check database URL format
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl.includes('postgresql://') && dbUrl.includes('neon.tech')) {
        this.log('env', 'pass', 'Database URL format is correct');
      } else {
        this.log('env', 'fail', 'Database URL format appears incorrect', { 
          hasPostgresql: dbUrl.includes('postgresql://'),
          hasNeonHost: dbUrl.includes('neon.tech')
        });
      }
    }
  }

  async checkStackAuthAPI() {
    console.log('\n🔍 Checking Stack Auth API Access...');
    
    const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
    
    if (!projectId) {
      this.log('api', 'fail', 'Cannot check API without project ID');
      return;
    }

    // Check JWKS endpoint
    const jwksUrl = `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`;
    
    return new Promise((resolve) => {
      https.get(jwksUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const jwks = JSON.parse(data);
              this.log('api', 'pass', 'JWKS endpoint accessible', { 
                statusCode: res.statusCode,
                keysCount: jwks.keys ? jwks.keys.length : 0
              });
            } catch (error) {
              this.log('api', 'fail', 'JWKS endpoint returned invalid JSON', { 
                statusCode: res.statusCode,
                error: error.message
              });
            }
          } else {
            this.log('api', 'fail', 'JWKS endpoint not accessible', { 
              statusCode: res.statusCode,
              response: data.substring(0, 200)
            });
          }
          resolve();
        });
      }).on('error', (error) => {
        this.log('api', 'fail', 'Failed to connect to Stack Auth API', { 
          error: error.message,
          url: jwksUrl
        });
        resolve();
      });
    });
  }

  async checkDatabaseConnection() {
    console.log('\n🔍 Checking Database Connection...');
    
    const prisma = new PrismaClient();
    
    try {
      // Test basic connection
      await prisma.$connect();
      this.log('database', 'pass', 'Database connection successful');
      
      // Test table existence
      const tableCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('profiles', 'usage_logs')
      `;
      
      const count = parseInt(tableCount[0].count);
      if (count >= 2) {
        this.log('database', 'pass', 'Required tables exist', { tableCount: count });
      } else {
        this.log('database', 'fail', 'Missing required tables', { 
          expectedTables: ['profiles', 'usage_logs'],
          foundCount: count
        });
      }
      
      // Test user profile functionality
      const profileCount = await prisma.profile.count();
      this.log('database', 'pass', 'Profile table accessible', { profileCount });
      
    } catch (error) {
      this.log('database', 'fail', 'Database connection failed', { 
        error: error.message,
        code: error.code
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  async checkStackAuthConfiguration() {
    console.log('\n🔍 Checking Stack Auth Dashboard Configuration...');
    
    const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
    const dashboardUrl = `https://app.stack-auth.com/projects/${projectId}`;
    
    this.log('api', 'info', 'Manual verification required for Stack Auth dashboard', {
      dashboardUrl,
      requiredSettings: [
        'Email/Password authentication enabled',
        'Domain whitelist includes localhost:3000',
        'Redirect URLs configured',
        'API keys match environment variables'
      ]
    });
    
    console.log('\n📋 Manual Stack Auth Dashboard Checklist:');
    console.log(`   1. Visit: ${dashboardUrl}`);
    console.log('   2. Go to "Auth Methods" section');
    console.log('   3. ✅ Enable "Email/Password" as primary method');
    console.log('   4. Go to "Domains" section');
    console.log('   5. ✅ Add "localhost:3000" to allowed origins');
    console.log('   6. ✅ Add "https://app-bitter-dust-73732609.dpl.myneon.app" for production');
    console.log('   7. Go to "Redirects" section');
    console.log('   8. ✅ Set success redirect to "/dashboard"');
    console.log('   9. ✅ Set error redirect to "/auth/signin"');
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 STACK AUTH CONFIGURATION REPORT');
    console.log('='.repeat(60));
    
    const categories = ['env', 'api', 'database'];
    let totalPassed = 0;
    let totalFailed = 0;
    
    categories.forEach(category => {
      const result = this.results[category];
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      
      console.log(`\n${categoryName}:`);
      console.log(`  ✅ Passed: ${result.passed}`);
      console.log(`  ❌ Failed: ${result.failed}`);
      console.log(`  📊 Success Rate: ${result.passed + result.failed > 0 ? Math.round((result.passed / (result.passed + result.failed)) * 100) : 0}%`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`📈 OVERALL RESULTS:`);
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log(`   📊 Overall Success Rate: ${totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All checks passed! Stack Auth should be ready to use.');
      this.results.overall = 'ready';
    } else if (totalFailed <= 2) {
      console.log('\n⚠️  Minor issues detected. Authentication may work with limitations.');
      this.results.overall = 'partial';
    } else {
      console.log('\n🚨 Critical issues detected. Authentication likely will not work.');
      this.results.overall = 'failed';
    }
    
    console.log('\n📝 Next Steps:');
    if (totalFailed > 0) {
      console.log('   1. Fix failed checks listed above');
      console.log('   2. Configure Stack Auth dashboard settings');
      console.log('   3. Re-run this checker');
    }
    console.log('   4. Test authentication with: node test-comprehensive-auth.cjs');
    
    return this.results;
  }

  async runAllChecks() {
    console.log('🚀 Starting Stack Auth Configuration Check');
    console.log('='.repeat(60));
    
    try {
      await this.checkEnvironmentVariables();
      await this.checkStackAuthAPI();
      await this.checkDatabaseConnection();
      await this.checkStackAuthConfiguration();
      
      return this.generateReport();
    } catch (error) {
      console.error('❌ Critical error during configuration check:', error);
      this.results.overall = 'error';
      return this.results;
    }
  }
}

// Run the checker
if (require.main === module) {
  const checker = new StackAuthChecker();
  checker.runAllChecks()
    .then(results => {
      console.log('\n✨ Configuration check completed!');
      process.exit(results.overall === 'ready' ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = StackAuthChecker;