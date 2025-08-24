import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { stackServerApp } from "@/stack";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const verification = {
      timestamp: new Date().toISOString(),
      tests: {} as any
    };

    // Test 1: Database Connection
    try {
      const dbTest = await sql`SELECT COUNT(*) as count FROM neon_auth.users_sync WHERE deleted_at IS NULL`;
      verification.tests.database = {
        status: "✅ Connected",
        activeUsers: dbTest[0].count,
        success: true
      };
    } catch (error) {
      verification.tests.database = {
        status: "❌ Failed",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      };
    }

    // Test 2: Schema Check
    try {
      const schemaTest = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'neon_auth' AND table_name = 'users_sync'
        ORDER BY ordinal_position
      `;
      verification.tests.schema = {
        status: "✅ Valid",
        columns: schemaTest.map(col => `${col.column_name}: ${col.data_type}`),
        success: true
      };
    } catch (error) {
      verification.tests.schema = {
        status: "❌ Invalid",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      };
    }

    // Test 3: User Data Sample
    try {
      const usersTest = await sql`
        SELECT id, name, email, created_at
        FROM neon_auth.users_sync 
        WHERE deleted_at IS NULL 
        ORDER BY created_at DESC
        LIMIT 3
      `;
      verification.tests.users = {
        status: "✅ Accessible",
        count: usersTest.length,
        sample: usersTest.map(u => ({
          id: u.id,
          name: u.name || "No name",
          email: u.email,
          created: new Date(u.created_at).toLocaleDateString()
        })),
        success: true
      };
    } catch (error) {
      verification.tests.users = {
        status: "❌ Error",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      };
    }

    // Test 4: Stack Auth Configuration
    try {
      const user = await stackServerApp.getUser();
      verification.tests.stackAuth = {
        status: "✅ Configured",
        currentUser: user ? {
          id: user.id,
          email: user.primaryEmail,
          name: user.displayName
        } : null,
        success: true
      };
    } catch (error) {
      verification.tests.stackAuth = {
        status: "❌ Error",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      };
    }

    // Test 5: Environment Variables
    const envVars = {
      'NEXT_PUBLIC_STACK_PROJECT_ID': !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
      'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY': !!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
      'STACK_SECRET_SERVER_KEY': !!process.env.STACK_SECRET_SERVER_KEY,
      'DATABASE_URL': !!process.env.DATABASE_URL
    };

    const allEnvSet = Object.values(envVars).every(Boolean);
    verification.tests.environment = {
      status: allEnvSet ? "✅ Complete" : "⚠️ Missing vars",
      variables: envVars,
      success: allEnvSet
    };

    // Overall status
    const allTests = Object.values(verification.tests);
    const allPassed = allTests.every((test: any) => test.success);
    
    verification.overall = {
      status: allPassed ? "✅ All Systems Operational" : "⚠️ Some Issues Detected",
      success: allPassed,
      passedTests: allTests.filter((test: any) => test.success).length,
      totalTests: allTests.length
    };

    return NextResponse.json(verification, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: "Verification failed", 
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
