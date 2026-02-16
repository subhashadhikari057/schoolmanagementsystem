// prisma/seed.ts - Simplified Seed File with Admin Login Only
/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Necessary Roles
  const roles = [
    'SUPER_ADMIN',
    'ADMIN',
    'ACCOUNTANT',
    'TEACHER',
    'STUDENT',
    'PARENT',
    'STAFF',
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: {
        name: role,
        description: `${role} role`,
        isSystemRole: role === 'SUPER_ADMIN',
      },
    });
  }

  // 1b. Ensure baseline permissions exist (extend this list as new domain actions are added)
  const permissionCodes = [
    'FINANCE_MANAGE_FEES',
    'FINANCE_MANAGE_SCHOLARSHIPS',
    'FINANCE_MANAGE_CHARGES',
  ];
  for (const perm of permissionCodes) {
    await prisma.permission.upsert({
      where: { code: perm },
      update: {},
      create: { code: perm, description: `${perm} permission` },
    });
  }

  // 1c. Grant ALL permissions to SUPER_ADMIN (data-driven super admin power)
  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
    select: { id: true },
  });
  if (superAdminRole) {
    // Clear existing role-permission links then recreate (idempotent)
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id },
    });
    if (allPermissions.length) {
      await prisma.rolePermission.createMany({
        data: allPermissions.map(p => ({
          roleId: superAdminRole.id,
          permissionId: p.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  // 2. Create Super Admin User
  const passwordHash = await argon2.hash('password123');
  await prisma.user.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: {
      passwordHash,
      fullName: 'Super Admin',
      isActive: true,
    },
    create: {
      email: 'superadmin@gmail.com',
      fullName: 'Super Admin',
      passwordHash,
      isActive: true,
      roles: {
        create: {
          role: {
            connect: { name: 'SUPER_ADMIN' },
          },
        },
      },
    },
  });

  // 3. Create Admin User
  const adminPasswordHash = await argon2.hash('password123');
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      passwordHash: adminPasswordHash,
      fullName: 'System Admin',
      isActive: true,
    },
    create: {
      email: 'admin@gmail.com',
      fullName: 'System Admin',
      passwordHash: adminPasswordHash,
      isActive: true,
      roles: {
        create: {
          role: {
            connect: { name: 'ADMIN' },
          },
        },
      },
    },
  });

  // 4. Seed Leave Types (system-level baseline)
  const leaveTypes = [
    {
      name: 'Substitute Leave',
      description:
        'Leave granted when teacher has earned substitute credit by working on leave/public holidays.',
      maxDays: 365,
      isPaid: true,
      paidDays: 365,
      limitPeriod: 'YEAR',
      eligibilityGender: 'ANY',
      prorateOnTenure: false,
      proratePeriodMonths: 12,
      carryForwardLimit: null,
      encashAfterLimit: null,
      requiresSubstituteCredit: true,
      status: 'ACTIVE',
    },
  ] as const;

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: leaveType.name },
      update: {
        description: leaveType.description,
        maxDays: leaveType.maxDays,
        isPaid: leaveType.isPaid,
        paidDays: leaveType.paidDays,
        limitPeriod: leaveType.limitPeriod,
        eligibilityGender: leaveType.eligibilityGender,
        prorateOnTenure: leaveType.prorateOnTenure,
        proratePeriodMonths: leaveType.proratePeriodMonths,
        carryForwardLimit: leaveType.carryForwardLimit,
        encashAfterLimit: leaveType.encashAfterLimit,
        requiresSubstituteCredit: leaveType.requiresSubstituteCredit,
        status: leaveType.status,
      },
      create: {
        name: leaveType.name,
        description: leaveType.description,
        maxDays: leaveType.maxDays,
        isPaid: leaveType.isPaid,
        paidDays: leaveType.paidDays,
        limitPeriod: leaveType.limitPeriod,
        eligibilityGender: leaveType.eligibilityGender,
        prorateOnTenure: leaveType.prorateOnTenure,
        proratePeriodMonths: leaveType.proratePeriodMonths,
        carryForwardLimit: leaveType.carryForwardLimit,
        encashAfterLimit: leaveType.encashAfterLimit,
        requiresSubstituteCredit: leaveType.requiresSubstituteCredit,
        status: leaveType.status,
      },
    });
  }

  // Keep only system-level substitute leave visible from seed baseline
  await prisma.leaveType.updateMany({
    where: {
      name: {
        not: 'Substitute Leave',
      },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      status: 'INACTIVE',
    },
  });

  console.log('✅ Admin seed data created successfully!');
  console.log(`✅ Seeded ${leaveTypes.length} leave types.`);
  console.log(
    `🔐 SUPER_ADMIN granted ${permissionCodes.length} baseline permissions + any additional existing (${allPermissions.length} total).`,
  );
  console.log('');
  console.log('🔐 ADMIN CREDENTIALS:');
  console.log('');
  console.log('👨‍💼 SUPER ADMIN:');
  console.log('  Email: superadmin@gmail.com');
  console.log('  Password: password123');
  console.log('');
  console.log('👨‍💼 ADMIN:');
  console.log('  Email: admin@gmail.com');
  console.log('  Password: password123');
  console.log('');
}

void main()
  .catch(e => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
