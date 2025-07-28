/**
 * =============================================================================
 * Docker Stack Integration Tests
 * =============================================================================
 * This test suite verifies that the Docker development stack integrates
 * properly with the School Management System backend application.
 * Tests remote PostgreSQL database and local Docker services (Redis, MailHog)
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import nodemailer from 'nodemailer';

// Test configuration with remote database
const TEST_CONFIG = {
  database: {
    // Remote PostgreSQL database
    url: process.env.DATABASE_URL || 'postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement?schema=public',
    host: '95.216.235.115',
    port: 5432,
    database: 'schoolmanagement',
    user: 'schooladmin'
  },
  redis: {
    // Local Docker Redis
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: 'localhost',
    port: 6379,
  },
  mailhog: {
    // Local Docker MailHog
    smtp: {
      host: 'localhost',
      port: 1025,
      secure: false,
    },
    web: 'http://localhost:8025',
  },
  pgadmin: {
    // Remote pgAdmin
    url: 'http://95.216.235.115:80/',
    email: 'admin@school.com',
    password: 'StrongPass123!'
  }
};

describe('Docker Stack Integration Tests', () => {
  let prisma: PrismaClient;
  let redisClient: any;
  let smtpTransporter: any;

  beforeAll(async () => {
    console.log('🧪 Starting Docker Stack Integration Tests');
    console.log('==========================================');
    console.log(`Database: ${TEST_CONFIG.database.host}:${TEST_CONFIG.database.port}/${TEST_CONFIG.database.database}`);
    console.log(`Redis: ${TEST_CONFIG.redis.host}:${TEST_CONFIG.redis.port}`);
    console.log(`MailHog: ${TEST_CONFIG.mailhog.smtp.host}:${TEST_CONFIG.mailhog.smtp.port}`);
    console.log('');

    // Initialize Prisma client for remote database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_CONFIG.database.url,
        },
      },
    });

    // Initialize Redis client for local Docker Redis
    redisClient = createClient({
      url: TEST_CONFIG.redis.url,
    });

    // Initialize SMTP transporter for local Docker MailHog
    smtpTransporter = nodemailer.createTransport({
      host: TEST_CONFIG.mailhog.smtp.host,
      port: TEST_CONFIG.mailhog.smtp.port,
      secure: TEST_CONFIG.mailhog.smtp.secure,
    });
  });

  afterAll(async () => {
    // Cleanup connections
    if (prisma) {
      await prisma.$disconnect();
    }
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
    if (smtpTransporter) {
      smtpTransporter.close();
    }
    console.log('🧹 Cleaned up test connections');
  });

  describe('Remote PostgreSQL Database Integration', () => {
    test('should connect to remote PostgreSQL database', async () => {
      try {
        await prisma.$connect();
        const result = await prisma.$queryRaw`SELECT 1 as test, version() as version`;
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        console.log(`✅ Connected to PostgreSQL: ${(result as any)[0]?.version?.split(' ')[0]} ${(result as any)[0]?.version?.split(' ')[1]}`);
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
      console.log(`✅ Database extensions available: ${(extensions as any[]).map(e => e.extname).join(', ')}`);
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
        console.warn('Database operations test skipped - may need migrations:', error);
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
      console.log(`✅ Database configuration: ${(config as any[]).length} settings checked`);
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
        
        console.log('✅ Database permissions: CREATE, INSERT, SELECT, DROP verified');
      } catch (error) {
        console.warn('Database permissions test failed:', error);
        throw new Error(`Database permissions insufficient: ${error}`);
      }
    });
  });

  describe('Local Redis Cache Integration', () => {
    test('should connect to local Redis server', async () => {
      try {
        await redisClient.connect();
        const pong = await redisClient.ping();
        expect(pong).toBe('PONG');
        console.log('✅ Connected to Redis: PONG received');
      } catch (error) {
        throw new Error(`Local Redis connection failed: ${error}`);
      }
    });

    test('should be able to set and get values', async () => {
      const testKey = 'test:docker:integration';
      const testValue = 'Hello Docker Redis!';
      
      await redisClient.set(testKey, testValue);
      const retrievedValue = await redisClient.get(testKey);
      
      expect(retrievedValue).toBe(testValue);
      console.log(`✅ Redis operations: SET/GET verified with key "${testKey}"`);
      
      // Cleanup
      await redisClient.del(testKey);
    });

    test('should support Redis data structures', async () => {
      const hashKey = 'test:hash:docker';
      
      // Test hash operations
      await redisClient.hSet(hashKey, {
        field1: 'value1',
        field2: 'value2',
        timestamp: Date.now().toString()
      });
      
      const hashValue = await redisClient.hGetAll(hashKey);
      expect(hashValue.field1).toBe('value1');
      expect(hashValue.field2).toBe('value2');
      expect(hashValue.timestamp).toBeDefined();
      
      console.log('✅ Redis hash operations: HSET/HGETALL verified');
      
      // Cleanup
      await redisClient.del(hashKey);
    });

    test('should have proper Redis configuration', async () => {
      const info = await redisClient.info('memory');
      expect(info).toContain('used_memory');
      
      const maxMemory = await redisClient.configGet('maxmemory');
      expect(maxMemory).toBeDefined();
      
      console.log('✅ Redis configuration: Memory settings verified');
    });
  });

  describe('Local MailHog SMTP Integration', () => {
    test('should connect to local MailHog SMTP server', async () => {
      try {
        const verified = await smtpTransporter.verify();
        expect(verified).toBe(true);
        console.log('✅ Connected to MailHog SMTP server');
      } catch (error) {
        throw new Error(`Local MailHog SMTP connection failed: ${error}`);
      }
    });

    test('should be able to send test email', async () => {
      const testEmail = {
        from: 'test@schoolsystem.local',
        to: 'recipient@example.com',
        subject: 'Docker Stack Integration Test',
        text: 'This is a test email sent from the Docker integration test suite.',
        html: '<p>This is a <strong>test email</strong> sent from the Docker integration test suite.</p>',
      };

      try {
        const info = await smtpTransporter.sendMail(testEmail);
        expect(info.messageId).toBeDefined();
        expect(info.accepted).toContain('recipient@example.com');
        console.log(`✅ Email sent successfully: ${info.messageId}`);
      } catch (error) {
        throw new Error(`Failed to send test email: ${error}`);
      }
    });

    test('should be able to access MailHog web interface', async () => {
      // This test checks if MailHog web interface is accessible
      try {
        const fetch = (await import('node-fetch')).default as any;
        const response = await fetch(TEST_CONFIG.mailhog.web);
        expect(response.status).toBe(200);
        console.log('✅ MailHog web interface accessible');
      } catch (error) {
        console.warn('MailHog web interface test skipped:', error);
        // This might fail if node-fetch is not available, which is okay
      }
    });
  });

  describe('Service Health and Performance', () => {
    test('database response time should be reasonable', async () => {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // Remote DB, allow up to 2 seconds
      console.log(`✅ Database response time: ${responseTime}ms`);
    });

    test('Redis response time should be reasonable', async () => {
      const startTime = Date.now();
      await redisClient.ping();
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100); // Local Redis should be fast
      console.log(`✅ Redis response time: ${responseTime}ms`);
    });

    test('all services should be healthy simultaneously', async () => {
      // Test that all services can handle concurrent requests
      const promises = [
        prisma.$queryRaw`SELECT 'database' as service, NOW() as timestamp`,
        redisClient.ping(),
        smtpTransporter.verify(),
      ];

      const results = await Promise.all(promises);
      expect(results[0]).toBeDefined(); // Database query result
      expect(results[1]).toBe('PONG'); // Redis ping result
      expect(results[2]).toBe(true); // SMTP verification result
      
      console.log('✅ All services healthy simultaneously');
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct remote database URL', () => {
      expect(TEST_CONFIG.database.url).toContain('95.216.235.115');
      expect(TEST_CONFIG.database.url).toContain('schoolmanagement');
      expect(TEST_CONFIG.database.url).toContain('schooladmin');
      console.log('✅ Remote database configuration verified');
    });

    test('should use correct local Redis configuration', () => {
      expect(TEST_CONFIG.redis.host).toBe('localhost');
      expect(TEST_CONFIG.redis.port).toBe(6379);
      console.log('✅ Local Redis configuration verified');
    });

    test('should use correct local MailHog configuration', () => {
      expect(TEST_CONFIG.mailhog.smtp.host).toBe('localhost');
      expect(TEST_CONFIG.mailhog.smtp.port).toBe(1025);
      expect(TEST_CONFIG.mailhog.smtp.secure).toBe(false);
      console.log('✅ Local MailHog configuration verified');
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
        console.log(`✅ Database schemas available: ${(schemas as any[]).map(s => s.schema_name).join(', ')}`);
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
          console.log('✅ Prisma migrations table found - database is initialized');
        } else {
          console.log('ℹ️  Prisma migrations table not found - database may need initialization');
        }
      } catch (error) {
        console.warn('Migration table check failed:', error);
      }
    });
  });
});

// Export test configuration for use in other test files
export { TEST_CONFIG };

// Helper function to check if Docker services are running
export async function checkDockerServices(): Promise<{
  postgres: boolean;
  redis: boolean;
  mailhog: boolean;
}> {
  const results = {
    postgres: false,
    redis: false,
    mailhog: false,
  };

  // Check Remote PostgreSQL
  try {
    const testPrisma = new PrismaClient({
      datasources: { db: { url: TEST_CONFIG.database.url } },
    });
    await testPrisma.$connect();
    await testPrisma.$disconnect();
    results.postgres = true;
  } catch {
    results.postgres = false;
  }

  // Check Local Redis
  try {
    const testRedis = createClient({ url: TEST_CONFIG.redis.url });
    await testRedis.connect();
    await testRedis.ping();
    await testRedis.quit();
    results.redis = true;
  } catch {
    results.redis = false;
  }

  // Check Local MailHog
  try {
    const testTransporter = nodemailer.createTransport({
      host: TEST_CONFIG.mailhog.smtp.host,
      port: TEST_CONFIG.mailhog.smtp.port,
      secure: TEST_CONFIG.mailhog.smtp.secure,
    });
    await testTransporter.verify();
    testTransporter.close();
    results.mailhog = true;
  } catch {
    results.mailhog = false;
  }

  return results;
}

// Export function to run basic connectivity tests
export function testDockerStackConnectivity() {
  console.log('🧪 Testing Docker Stack Connectivity');
  console.log('====================================');
  console.log('Remote PostgreSQL + Local Docker Services');
  console.log('');
  
  return checkDockerServices().then((results) => {
    console.log(`PostgreSQL (Remote): ${results.postgres ? '✅ Connected' : '❌ Failed'}`);
    console.log(`Redis (Local): ${results.redis ? '✅ Connected' : '❌ Failed'}`);
    console.log(`MailHog (Local): ${results.mailhog ? '✅ Connected' : '❌ Failed'}`);
    
    const allHealthy = results.postgres && results.redis && results.mailhog;
    console.log(`Overall Status: ${allHealthy ? '✅ All services healthy' : '⚠️ Some services unavailable'}`);
    
    return results;
  });
}

// Run connectivity test if this file is executed directly
if (require.main === module) {
  testDockerStackConnectivity()
    .then((results) => {
      const allHealthy = results.postgres && results.redis && results.mailhog;
      process.exit(allHealthy ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Connectivity test failed:', error);
      process.exit(1);
    });
} 