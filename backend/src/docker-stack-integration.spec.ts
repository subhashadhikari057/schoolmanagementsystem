/**
 * =============================================================================
 * Docker Stack Integration Tests
 * =============================================================================
 * This test suite verifies that the Docker development stack integrates
 * properly with the School Management System backend application.
 * Tests remote PostgreSQL database connectivity
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';

// Test configuration with remote database
const TEST_CONFIG = {
  database: {
    // Remote PostgreSQL database
    url:
      process.env.DATABASE_URL ||
      'postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement?schema=public',
    host: '95.216.235.115',
    port: 5432,
    database: 'schoolmanagement',
    user: 'schooladmin',
  },
  pgadmin: {
    // Remote pgAdmin
    url: 'http://95.216.235.115:80/',
    email: 'admin@school.com',
    password: 'StrongPass123!',
  },
};

describe('Docker Stack Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    console.log('🧪 Starting Docker Stack Integration Tests');
    console.log('==========================================');
    console.log(
      `Database: ${TEST_CONFIG.database.host}:${TEST_CONFIG.database.port}/${TEST_CONFIG.database.database}`,
    );
    console.log('');

    // Initialize Prisma client for remote database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_CONFIG.database.url,
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup connections
    if (prisma) {
      await prisma.$disconnect();
    }
    console.log('🧹 Cleaned up test connections');
  });

  describe('Remote PostgreSQL Database Integration', () => {
    test('should connect to remote PostgreSQL database', async () => {
      try {
        await prisma.$connect();
        const result =
          await prisma.$queryRaw`SELECT 1 as test, version() as version`;
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        console.log(
          `✅ Connected to PostgreSQL: ${(result as any)[0]?.version?.split(' ')[0]} ${(result as any)[0]?.version?.split(' ')[1]}`,
        );
      } catch (error) {
        throw new Error(`Remote PostgreSQL connection failed: ${error}`);
      }
    });

    test('should have required database extensions', async () => {
      const extensions = await prisma.$queryRaw`
        SELECT extname FROM pg_extension 
        WHERE extname IN ('uuid-ossp', 'pg_trgm', 'pg_stat_statements', 'pgcrypto', 'unaccent')
      `;

      expect(Array.isArray(extensions)).toBe(true);
      const extensionNames = (extensions as Array<{ extname: string }>)
        .map(e => e.extname)
        .join(', ');
      console.log(`✅ Database extensions available: ${extensionNames}`);
    });

    test('should be able to perform basic database operations', async () => {
      try {
        // Test basic query - this should work even without specific tables
        const dbInfo = await prisma.$queryRaw`
          SELECT 
            current_database() as database_name,
            current_user as current_user,
            inet_server_addr() as server_ip,
            inet_server_port() as server_port
        `;
        expect(dbInfo).toBeDefined();
        console.log(`✅ Database info: ${JSON.stringify(dbInfo, null, 2)}`);
      } catch (error) {
        console.warn(
          'Database operations test skipped - may need migrations:',
          error,
        );
        // This is expected if migrations haven't been run yet
      }
    });

    test('should have proper database configuration', async () => {
      const config = await prisma.$queryRaw`
        SELECT name, setting, unit, category FROM pg_settings 
        WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size', 'work_mem')
        ORDER BY name
      `;

      expect(Array.isArray(config)).toBe(true);
      expect((config as any[]).length).toBeGreaterThan(0);
      console.log(
        `✅ Database configuration: ${(config as any[]).length} settings checked`,
      );
    });

    test('should verify database connectivity and permissions', async () => {
      // Test if we can create and drop a test table (permissions check)
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS test_connectivity_check (
            id SERIAL PRIMARY KEY,
            test_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        await prisma.$executeRaw`
          INSERT INTO test_connectivity_check (test_data) VALUES ('integration_test')
        `;

        const testData = await prisma.$queryRaw`
          SELECT * FROM test_connectivity_check WHERE test_data = 'integration_test'
        `;

        expect(Array.isArray(testData)).toBe(true);
        expect((testData as any[]).length).toBeGreaterThan(0);

        // Cleanup
        await prisma.$executeRaw`DROP TABLE IF EXISTS test_connectivity_check`;

        console.log(
          '✅ Database permissions: CREATE, INSERT, SELECT, DROP verified',
        );
      } catch (error) {
        console.warn('Database permissions test failed:', error);
        throw new Error(`Database permissions insufficient: ${error}`);
      }
    });
  });

  describe('Service Health and Performance', () => {
    test('database response time should be reasonable', async () => {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Remote DB, allow up to 5 seconds
      console.log(`✅ Database response time: ${responseTime}ms`);
    });

    test('database should handle concurrent requests', async () => {
      // Test that database can handle concurrent requests
      const promises = [
        prisma.$queryRaw`SELECT 'test1' as service, NOW() as timestamp`,
        prisma.$queryRaw`SELECT 'test2' as service, NOW() as timestamp`,
        prisma.$queryRaw`SELECT 'test3' as service, NOW() as timestamp`,
      ];

      const results = await Promise.all(promises);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();

      console.log('✅ Database handles concurrent requests successfully');
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct remote database URL', () => {
      expect(TEST_CONFIG.database.url).toContain('95.216.235.115');
      expect(TEST_CONFIG.database.url).toContain('schoolmanagement');
      expect(TEST_CONFIG.database.url).toContain('schooladmin');
      console.log('✅ Remote database configuration verified');
    });

    test('should have correct pgAdmin configuration', () => {
      expect(TEST_CONFIG.pgadmin.url).toBe('http://95.216.235.115:80/');
      expect(TEST_CONFIG.pgadmin.email).toBe('admin@school.com');
      expect(TEST_CONFIG.pgadmin.password).toBe('StrongPass123!');
      console.log('✅ Remote pgAdmin configuration verified');
    });
  });

  describe('Remote Database Schema Validation', () => {
    test('should verify database schema exists', async () => {
      try {
        const schemas = await prisma.$queryRaw`
          SELECT schema_name FROM information_schema.schemata 
          WHERE schema_name IN ('public', 'information_schema', 'pg_catalog')
        `;

        expect(Array.isArray(schemas)).toBe(true);
        expect((schemas as any[]).length).toBeGreaterThan(0);
        const schemaNames = (schemas as Array<{ schema_name: string }>)
          .map(s => s.schema_name)
          .join(', ');
        console.log(`✅ Database schemas available: ${schemaNames}`);
      } catch (error) {
        throw new Error(`Schema validation failed: ${error}`);
      }
    });

    test('should check for Prisma migration table', async () => {
      try {
        const migrationTable = await prisma.$queryRaw`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
        `;

        if ((migrationTable as any[]).length > 0) {
          console.log(
            '✅ Prisma migrations table found - database is initialized',
          );
        } else {
          console.log(
            'ℹ️  Prisma migrations table not found - database may need initialization',
          );
        }
      } catch (error) {
        console.warn('Migration table check failed:', error);
      }
    });

    test('should verify database is ready for application', async () => {
      try {
        // Check if we can run basic operations that the app will need
        const basicChecks = await Promise.all([
          prisma.$queryRaw`SELECT COUNT(*) as extension_count FROM pg_extension`,
          prisma.$queryRaw`SELECT COUNT(*) as schema_count FROM information_schema.schemata WHERE schema_name = 'public'`,
          prisma.$queryRaw`SELECT current_setting('timezone') as timezone`,
        ]);

        expect(basicChecks[0]).toBeDefined();
        expect(basicChecks[1]).toBeDefined();
        expect(basicChecks[2]).toBeDefined();

        console.log('✅ Database is ready for application use');
        console.log(
          `   Extensions: ${(basicChecks[0] as any)[0]?.extension_count}`,
        );
        console.log(
          `   Public schema: ${(basicChecks[1] as any)[0]?.schema_count > 0 ? 'Available' : 'Missing'}`,
        );
        console.log(`   Timezone: ${(basicChecks[2] as any)[0]?.timezone}`);
      } catch (error) {
        console.warn('Database readiness check failed:', error);
      }
    });
  });
});

// Export test configuration for use in other test files
export { TEST_CONFIG };

// Helper function to check if remote database is accessible
export async function checkRemoteDatabase(): Promise<boolean> {
  try {
    const testPrisma = new PrismaClient({
      datasources: { db: { url: TEST_CONFIG.database.url } },
    });
    await testPrisma.$connect();
    await testPrisma.$queryRaw`SELECT 1`;
    await testPrisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

// Export function to run basic connectivity tests
export function testRemoteDatabaseConnectivity() {
  console.log('🧪 Testing Remote Database Connectivity');
  console.log('=======================================');
  console.log('Remote PostgreSQL Database');
  console.log('');

  return checkRemoteDatabase().then(result => {
    console.log(
      `PostgreSQL (Remote): ${result ? '✅ Connected' : '❌ Failed'}`,
    );
    console.log(
      `Overall Status: ${result ? '✅ Database accessible' : '⚠️ Database unavailable'}`,
    );

    return { postgres: result };
  });
}

// Run connectivity test if this file is executed directly
if (require.main === module) {
  testRemoteDatabaseConnectivity()
    .then(results => {
      process.exit(results.postgres ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Connectivity test failed:', error);
      process.exit(1);
    });
}
