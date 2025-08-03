/**
 * =============================================================================
 * Test Seed Data - School Management System
 * =============================================================================
 * Lightweight seed data specifically for testing and development
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { UserRole, AuditAction, AuditModule, AuditStatus } from 'shared-types';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting test seed...');

  // Create test roles (minimal set)
  const testRoles = [
    { name: UserRole.SUPER_ADMIN, description: 'Super Administrator - Test' },
    { name: UserRole.ADMIN, description: 'Administrator - Test' },
    { name: UserRole.TEACHER, description: 'Teacher - Test' },
    { name: UserRole.STUDENT, description: 'Student - Test' },
  ];

  for (const roleData of testRoles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
  }

  console.log('✅ Test roles created');

  // Create test permissions (expanded set for new modules)
  const testPermissions = [
    // User permissions
    { code: 'USER_VIEW', description: 'View users', module: 'USER' },
    { code: 'USER_CREATE', description: 'Create users', module: 'USER' },
    { code: 'USER_EDIT', description: 'Edit users', module: 'USER' },
    { code: 'USER_DELETE', description: 'Delete users', module: 'USER' },

    // Teacher permissions
    {
      code: 'TEACHER_VIEW',
      description: 'View teachers',
      module: 'TEACHER',
    },
    {
      code: 'TEACHER_CREATE',
      description: 'Create teachers',
      module: 'TEACHER',
    },
    {
      code: 'TEACHER_EDIT',
      description: 'Edit teachers',
      module: 'TEACHER',
    },
    {
      code: 'TEACHER_DELETE',
      description: 'Delete teachers',
      module: 'TEACHER',
    },
    {
      code: 'TEACHER_ASSIGN_SUBJECTS',
      description: 'Assign subjects to teachers',
      module: 'TEACHER',
    },
    {
      code: 'TEACHER_ASSIGN_CLASSES',
      description: 'Assign classes to teachers',
      module: 'TEACHER',
    },

    // Subject permissions
    {
      code: 'SUBJECT_VIEW',
      description: 'View subjects',
      module: 'SUBJECT',
    },
    {
      code: 'SUBJECT_CREATE',
      description: 'Create subjects',
      module: 'SUBJECT',
    },
    {
      code: 'SUBJECT_EDIT',
      description: 'Edit subjects',
      module: 'SUBJECT',
    },
    {
      code: 'SUBJECT_DELETE',
      description: 'Delete subjects',
      module: 'SUBJECT',
    },

    // Auth permissions
    {
      code: 'AUTH_LOGIN',
      description: 'Login access',
      module: 'AUTH',
    },
    {
      code: 'AUTH_REFRESH',
      description: 'Refresh token access',
      module: 'AUTH',
    },
    {
      code: 'AUTH_LOGOUT',
      description: 'Logout access',
      module: 'AUTH',
    },
  ];

  for (const permData of testPermissions) {
    await prisma.permission.upsert({
      where: { code: permData.code },
      update: {},
      create: permData,
    });
  }

  console.log('✅ Test permissions created');

  // Assign permissions to roles (simplified)
  const superAdminRole = await prisma.role.findUnique({
    where: { name: UserRole.SUPER_ADMIN },
  });
  const adminRole = await prisma.role.findUnique({
    where: { name: UserRole.ADMIN },
  });
  const teacherRole = await prisma.role.findUnique({
    where: { name: UserRole.TEACHER },
  });

  if (superAdminRole && adminRole && teacherRole) {
    const permissions = await prisma.permission.findMany();

    // Super Admin gets all permissions
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Admin gets most permissions (excluding some super admin only)
    const adminPermissions = permissions.filter(
      p =>
        p.code.includes('VIEW') ||
        p.code.includes('EDIT') ||
        p.code.includes('CREATE') ||
        p.code.includes('ASSIGN'),
    );
    for (const permission of adminPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Teacher gets view permissions and auth permissions
    const teacherPermissions = permissions.filter(
      p =>
        p.code.includes('VIEW') ||
        p.code.includes('AUTH') ||
        (p.code.includes('TEACHER') &&
          (p.code.includes('EDIT') || p.code.includes('UPDATE'))),
    );
    for (const permission of teacherPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: teacherRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: teacherRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✅ Test role permissions assigned');

  // Create test users (minimal set)
  const testUsers = [
    {
      email: 'test.admin@school.test',
      fullName: 'Test Administrator',
      passwordHash: await argon2.hash('TestAdmin123!'),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    {
      email: 'test.teacher@school.test',
      fullName: 'Test Teacher',
      passwordHash: await argon2.hash('TestTeacher123!'),
      role: UserRole.TEACHER,
      isActive: true,
    },
    {
      email: 'test.student@school.test',
      fullName: 'Test Student',
      passwordHash: await argon2.hash('TestStudent123!'),
      role: UserRole.STUDENT,
      isActive: true,
    },
  ];

  for (const userData of testUsers) {
    const role = await prisma.role.findUnique({
      where: { name: userData.role },
    });
    if (!role) continue;

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        fullName: userData.fullName,
        isActive: userData.isActive,
      },
      create: {
        email: userData.email,
        fullName: userData.fullName,
        passwordHash: userData.passwordHash,
        isActive: userData.isActive,

        roles: {
          create: {
            roleId: role.id,
            assignedAt: new Date(),
          },
        },
      },
    });

    console.log(`✅ Test user created: ${user.email} (${userData.role})`);
  }

  // Create test audit log entry
  await prisma.auditLog.create({
    data: {
      userId: null,
      action: AuditAction.CREATE,
      module: AuditModule.USER,
      resourceType: 'SEED',
      resourceId: 'test-seed',
      details: { message: 'Test seed data created' },
      status: AuditStatus.SUCCESS,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Seed Script',
      traceId: `test-seed-${Date.now()}`,
    },
  });

  console.log('✅ Test audit log created');

  // Note: Subject and Teacher modules will be added in future schema migrations
  // For now, we only seed the basic auth and permission structure
  console.log(
    '📝 Note: Teacher and Subject modules will be available after schema migration',
  );

  console.log('🎉 Test seed completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Test seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
