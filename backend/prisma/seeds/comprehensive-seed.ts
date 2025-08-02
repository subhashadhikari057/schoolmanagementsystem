/**
 * =============================================================================
 * Comprehensive Database Seeding
 * =============================================================================
 * Enhanced seeding system for the School Management System
 * Supports VPS database configuration and comprehensive test data
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// =============================================================================
// SEED DATA CONFIGURATION
// =============================================================================

interface SeedConfig {
  environment: 'development' | 'testing' | 'production';
  skipExistingData: boolean;
  createTestData: boolean;
  verbose: boolean;
}

const config: SeedConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  skipExistingData: true,
  createTestData: process.env.NODE_ENV !== 'production',
  verbose: true,
};

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

class SeedLogger {
  private static log(level: string, message: string, data?: any) {
    if (!config.verbose) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static info(message: string, data?: any) {
    this.log('info', `✅ ${message}`, data);
  }

  static warn(message: string, data?: any) {
    this.log('warn', `⚠️  ${message}`, data);
  }

  static error(message: string, data?: any) {
    this.log('error', `❌ ${message}`, data);
  }

  static debug(message: string, data?: any) {
    this.log('debug', `🔍 ${message}`, data);
  }
}

// =============================================================================
// SEED DATA DEFINITIONS
// =============================================================================

const SYSTEM_ROLES = [
  {
    name: 'SUPERADMIN',
    description: 'Super Administrator with full system access',
    isSystemRole: true,
  },
  {
    name: 'ADMIN',
    description: 'School Administrator with management access',
    isSystemRole: true,
  },
  {
    name: 'TEACHER',
    description: 'Teacher with classroom and student management access',
    isSystemRole: false,
  },
  {
    name: 'STUDENT',
    description: 'Student with limited access to own data',
    isSystemRole: false,
  },
  {
    name: 'PARENT',
    description: "Parent with access to their children's data",
    isSystemRole: false,
  },
] as const;

const SYSTEM_PERMISSIONS = [
  // User Management
  { code: 'USER_CREATE', description: 'Create new users', module: 'USER' },
  { code: 'USER_READ', description: 'View user information', module: 'USER' },
  {
    code: 'USER_UPDATE',
    description: 'Update user information',
    module: 'USER',
  },
  { code: 'USER_DELETE', description: 'Delete users', module: 'USER' },

  // Role Management
  { code: 'ROLE_CREATE', description: 'Create new roles', module: 'ROLE' },
  { code: 'ROLE_READ', description: 'View role information', module: 'ROLE' },
  {
    code: 'ROLE_UPDATE',
    description: 'Update role information',
    module: 'ROLE',
  },
  { code: 'ROLE_DELETE', description: 'Delete roles', module: 'ROLE' },
  { code: 'ROLE_ASSIGN', description: 'Assign roles to users', module: 'ROLE' },

  // Student Management
  {
    code: 'STUDENT_CREATE',
    description: 'Create new students',
    module: 'STUDENT',
  },
  {
    code: 'STUDENT_READ',
    description: 'View student information',
    module: 'STUDENT',
  },
  {
    code: 'STUDENT_UPDATE',
    description: 'Update student information',
    module: 'STUDENT',
  },
  { code: 'STUDENT_DELETE', description: 'Delete students', module: 'STUDENT' },

  // Teacher Management
  {
    code: 'TEACHER_CREATE',
    description: 'Create new teachers',
    module: 'TEACHER',
  },
  {
    code: 'TEACHER_READ',
    description: 'View teacher information',
    module: 'TEACHER',
  },
  {
    code: 'TEACHER_UPDATE',
    description: 'Update teacher information',
    module: 'TEACHER',
  },
  { code: 'TEACHER_DELETE', description: 'Delete teachers', module: 'TEACHER' },

  // Academic Management
  {
    code: 'ACADEMIC_CREATE',
    description: 'Create academic records',
    module: 'ACADEMIC',
  },
  {
    code: 'ACADEMIC_READ',
    description: 'View academic records',
    module: 'ACADEMIC',
  },
  {
    code: 'ACADEMIC_UPDATE',
    description: 'Update academic records',
    module: 'ACADEMIC',
  },
  {
    code: 'ACADEMIC_DELETE',
    description: 'Delete academic records',
    module: 'ACADEMIC',
  },

  // System Administration
  {
    code: 'SYSTEM_CONFIG',
    description: 'System configuration access',
    module: 'SYSTEM',
  },
  { code: 'AUDIT_READ', description: 'View audit logs', module: 'AUDIT' },
  {
    code: 'BACKUP_CREATE',
    description: 'Create system backups',
    module: 'BACKUP',
  },
] as const;

const ROLE_PERMISSIONS = {
  SUPERADMIN: [
    'USER_CREATE',
    'USER_READ',
    'USER_UPDATE',
    'USER_DELETE',
    'ROLE_CREATE',
    'ROLE_READ',
    'ROLE_UPDATE',
    'ROLE_DELETE',
    'ROLE_ASSIGN',
    'STUDENT_CREATE',
    'STUDENT_READ',
    'STUDENT_UPDATE',
    'STUDENT_DELETE',
    'TEACHER_CREATE',
    'TEACHER_READ',
    'TEACHER_UPDATE',
    'TEACHER_DELETE',
    'ACADEMIC_CREATE',
    'ACADEMIC_READ',
    'ACADEMIC_UPDATE',
    'ACADEMIC_DELETE',
    'SYSTEM_CONFIG',
    'AUDIT_READ',
    'BACKUP_CREATE',
  ],
  ADMIN: [
    'USER_READ',
    'USER_UPDATE',
    'ROLE_READ',
    'ROLE_ASSIGN',
    'STUDENT_CREATE',
    'STUDENT_READ',
    'STUDENT_UPDATE',
    'STUDENT_DELETE',
    'TEACHER_CREATE',
    'TEACHER_READ',
    'TEACHER_UPDATE',
    'TEACHER_DELETE',
    'ACADEMIC_CREATE',
    'ACADEMIC_READ',
    'ACADEMIC_UPDATE',
    'ACADEMIC_DELETE',
    'AUDIT_READ',
  ],
  TEACHER: [
    'STUDENT_READ',
    'STUDENT_UPDATE',
    'ACADEMIC_CREATE',
    'ACADEMIC_READ',
    'ACADEMIC_UPDATE',
  ],
  STUDENT: ['ACADEMIC_READ'],
  PARENT: ['STUDENT_READ', 'ACADEMIC_READ'],
} as const;

const SYSTEM_USERS = [
  {
    email: 'superadmin@school.edu',
    phone: '+1234567890',
    fullName: 'System Super Administrator',
    password: 'SuperSecure123!',
    role: 'SUPERADMIN',
    isActive: true,
  },
  {
    email: 'admin@school.edu',
    phone: '+1234567891',
    fullName: 'School Administrator',
    password: 'AdminSecure123!',
    role: 'ADMIN',
    isActive: true,
  },
  {
    email: 'principal@school.edu',
    phone: '+1234567892',
    fullName: 'School Principal',
    password: 'PrincipalSecure123!',
    role: 'ADMIN',
    isActive: true,
  },
] as const;

const TEST_USERS = [
  // Teachers
  {
    email: 'teacher.math@school.edu',
    phone: '+1234567900',
    fullName: 'John Mathematics',
    password: 'Teacher123!',
    role: 'TEACHER',
    isActive: true,
  },
  {
    email: 'teacher.science@school.edu',
    phone: '+1234567901',
    fullName: 'Jane Science',
    password: 'Teacher123!',
    role: 'TEACHER',
    isActive: true,
  },
  {
    email: 'teacher.english@school.edu',
    phone: '+1234567902',
    fullName: 'Bob English',
    password: 'Teacher123!',
    role: 'TEACHER',
    isActive: true,
  },

  // Students
  {
    email: 'student1@school.edu',
    phone: '+1234567910',
    fullName: 'Alice Johnson',
    password: 'Student123!',
    role: 'STUDENT',
    isActive: true,
  },
  {
    email: 'student2@school.edu',
    phone: '+1234567911',
    fullName: 'Bob Smith',
    password: 'Student123!',
    role: 'STUDENT',
    isActive: true,
  },
  {
    email: 'student3@school.edu',
    phone: '+1234567912',
    fullName: 'Carol Davis',
    password: 'Student123!',
    role: 'STUDENT',
    isActive: true,
  },

  // Parents
  {
    email: 'parent1@school.edu',
    phone: '+1234567920',
    fullName: 'David Johnson',
    password: 'Parent123!',
    role: 'PARENT',
    isActive: true,
  },
  {
    email: 'parent2@school.edu',
    phone: '+1234567921',
    fullName: 'Emily Smith',
    password: 'Parent123!',
    role: 'PARENT',
    isActive: true,
  },
] as const;

// =============================================================================
// SEEDING FUNCTIONS
// =============================================================================

class DatabaseSeeder {
  private static async checkExistingData(table: string): Promise<number> {
    const count = await (prisma as any)[table].count();
    return count;
  }

  private static async shouldSkipSeeding(
    table: string,
    entityName: string,
  ): Promise<boolean> {
    if (!config.skipExistingData) return false;

    const count = await this.checkExistingData(table);
    if (count > 0) {
      SeedLogger.warn(
        `Skipping ${entityName} seeding - ${count} records already exist`,
      );
      return true;
    }
    return false;
  }

  // Seed system roles
  static async seedRoles(): Promise<void> {
    SeedLogger.info('Starting role seeding...');

    if (await this.shouldSkipSeeding('role', 'roles')) return;

    for (const roleData of SYSTEM_ROLES) {
      try {
        const role = await prisma.role.upsert({
          where: { name: roleData.name },
          update: {
            description: roleData.description,
            isSystemRole: roleData.isSystemRole,
          },
          create: {
            id: randomUUID(),
            name: roleData.name,
            description: roleData.description,
            isSystemRole: roleData.isSystemRole,
          },
        });

        SeedLogger.debug(`Created/updated role: ${role.name}`);
      } catch (error) {
        SeedLogger.error(`Failed to create role ${roleData.name}:`, error);
        throw error;
      }
    }

    SeedLogger.info(`Successfully seeded ${SYSTEM_ROLES.length} roles`);
  }

  // Seed system permissions
  static async seedPermissions(): Promise<void> {
    SeedLogger.info('Starting permission seeding...');

    if (await this.shouldSkipSeeding('permission', 'permissions')) return;

    for (const permData of SYSTEM_PERMISSIONS) {
      try {
        const permission = await prisma.permission.upsert({
          where: { code: permData.code },
          update: {
            description: permData.description,
            module: permData.module,
          },
          create: {
            id: randomUUID(),
            code: permData.code,
            description: permData.description,
            module: permData.module,
          },
        });

        SeedLogger.debug(`Created/updated permission: ${permission.code}`);
      } catch (error) {
        SeedLogger.error(
          `Failed to create permission ${permData.code}:`,
          error,
        );
        throw error;
      }
    }

    SeedLogger.info(
      `Successfully seeded ${SYSTEM_PERMISSIONS.length} permissions`,
    );
  }

  // Assign permissions to roles
  static async seedRolePermissions(): Promise<void> {
    SeedLogger.info('Starting role-permission assignments...');

    for (const [roleName, permissionCodes] of Object.entries(
      ROLE_PERMISSIONS,
    )) {
      try {
        const role = await prisma.role.findUnique({
          where: { name: roleName },
        });
        if (!role) {
          SeedLogger.error(`Role ${roleName} not found`);
          continue;
        }

        for (const permissionCode of permissionCodes) {
          const permission = await prisma.permission.findUnique({
            where: { code: permissionCode },
          });

          if (!permission) {
            SeedLogger.error(`Permission ${permissionCode} not found`);
            continue;
          }

          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              id: randomUUID(),
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }

        SeedLogger.debug(
          `Assigned ${permissionCodes.length} permissions to role: ${roleName}`,
        );
      } catch (error) {
        SeedLogger.error(
          `Failed to assign permissions to role ${roleName}:`,
          error,
        );
        throw error;
      }
    }

    SeedLogger.info('Successfully completed role-permission assignments');
  }

  // Seed system users
  static async seedUsers(): Promise<void> {
    SeedLogger.info('Starting user seeding...');

    const usersToSeed = config.createTestData
      ? [...SYSTEM_USERS, ...TEST_USERS]
      : SYSTEM_USERS;

    for (const userData of usersToSeed) {
      try {
        // Hash password
        const passwordHash = await argon2.hash(userData.password, {
          type: argon2.argon2id,
          memoryCost: 2 ** 16,
          timeCost: 3,
          parallelism: 1,
        });

        // Create or update user
        const user = await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            fullName: userData.fullName,
            phone: userData.phone,
            isActive: userData.isActive,
          },
          create: {
            id: randomUUID(),
            email: userData.email,
            phone: userData.phone,
            fullName: userData.fullName,
            passwordHash,
            isActive: userData.isActive,
          },
        });

        // Assign role
        const role = await prisma.role.findUnique({
          where: { name: userData.role },
        });
        if (role) {
          await prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: role.id,
              },
            },
            update: {},
            create: {
              id: randomUUID(),
              userId: user.id,
              roleId: role.id,
            },
          });
        }

        SeedLogger.debug(
          `Created/updated user: ${user.email} (${userData.role})`,
        );
      } catch (error) {
        SeedLogger.error(`Failed to create user ${userData.email}:`, error);
        throw error;
      }
    }

    SeedLogger.info(`Successfully seeded ${usersToSeed.length} users`);
  }

  // Create audit log entries for seeding
  static async createSeedAuditLog(): Promise<void> {
    try {
      const superAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@school.edu' },
      });

      if (superAdmin) {
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: superAdmin.id,
            action: 'DATABASE_SEED',
            module: 'SYSTEM',
            status: 'SUCCESS',
            details: {
              environment: config.environment,
              createTestData: config.createTestData,
              skipExistingData: config.skipExistingData,
              timestamp: new Date().toISOString(),
            },
            ipAddress: '127.0.0.1',
            userAgent: 'Database Seeder v1.0',
          },
        });

        SeedLogger.info('Created audit log for database seeding');
      }
    } catch (error) {
      SeedLogger.error('Failed to create seed audit log:', error);
    }
  }
}

// =============================================================================
// MAIN SEEDING FUNCTION
// =============================================================================

async function main(): Promise<void> {
  try {
    SeedLogger.info('🌱 Starting comprehensive database seeding...');
    SeedLogger.info(`Environment: ${config.environment}`);
    SeedLogger.info(`Skip existing data: ${config.skipExistingData}`);
    SeedLogger.info(`Create test data: ${config.createTestData}`);

    // Test database connection
    await prisma.$connect();
    SeedLogger.info('✅ Database connection established');

    // Run seeding operations
    await DatabaseSeeder.seedRoles();
    await DatabaseSeeder.seedPermissions();
    await DatabaseSeeder.seedRolePermissions();
    await DatabaseSeeder.seedUsers();
    await DatabaseSeeder.createSeedAuditLog();

    // Get final counts
    const counts = {
      roles: await prisma.role.count(),
      permissions: await prisma.permission.count(),
      rolePermissions: await prisma.rolePermission.count(),
      users: await prisma.user.count(),
      userRoles: await prisma.userRole.count(),
      auditLogs: await prisma.auditLog.count(),
    };

    SeedLogger.info('🎉 Database seeding completed successfully!');
    SeedLogger.info('Final database counts:', counts);
  } catch (error) {
    SeedLogger.error('Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// =============================================================================
// EXECUTION
// =============================================================================

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

// Main function for direct execution
export default main;

// Named exports for testing and utilities
export { DatabaseSeeder, SeedLogger, config as seedConfig };
