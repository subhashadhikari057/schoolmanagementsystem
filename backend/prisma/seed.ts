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

  // 4. Seed Leave Types (teacher leave policy setup)
  const leaveTypes = [
    {
      name: 'Weekly Leave',
      description: '1 day leave entitlement for every week.',
      maxDays: 1,
      isPaid: true,
      paidDays: 1,
      limitPeriod: 'WEEK',
      eligibilityGender: 'ANY',
      prorateOnTenure: false,
      proratePeriodMonths: 12,
      carryForwardLimit: null,
      encashAfterLimit: null,
      requiresSubstituteCredit: false,
      status: 'ACTIVE',
    },
    {
      name: 'Public Leave (Men)',
      description: 'Public leave for male teachers: 13 days per year.',
      maxDays: 13,
      isPaid: true,
      paidDays: 13,
      limitPeriod: 'YEAR',
      eligibilityGender: 'MALE',
      prorateOnTenure: false,
      proratePeriodMonths: 12,
      carryForwardLimit: null,
      encashAfterLimit: null,
      requiresSubstituteCredit: false,
      status: 'ACTIVE',
    },
    {
      name: 'Public Leave (Women)',
      description: 'Public leave for female teachers: 14 days per year.',
      maxDays: 14,
      isPaid: true,
      paidDays: 14,
      limitPeriod: 'YEAR',
      eligibilityGender: 'FEMALE',
      prorateOnTenure: false,
      proratePeriodMonths: 12,
      carryForwardLimit: null,
      encashAfterLimit: null,
      requiresSubstituteCredit: false,
      status: 'ACTIVE',
    },
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
    {
      name: 'Mourning Leave',
      description: 'Mourning leave entitlement: 13 days.',
      maxDays: 13,
      isPaid: true,
      paidDays: 13,
      limitPeriod: 'YEAR',
      eligibilityGender: 'ANY',
      prorateOnTenure: false,
      proratePeriodMonths: 12,
      carryForwardLimit: null,
      encashAfterLimit: null,
      requiresSubstituteCredit: false,
      status: 'ACTIVE',
    },
    {
      name: 'Maternity Leave (Women)',
      description: 'Women: total 98 days, paid leave 60 days.',
      maxDays: 98,
      isPaid: true,
      paidDays: 60,
      limitPeriod: 'LIFETIME',
      eligibilityGender: 'FEMALE',
      prorateOnTenure: false,
      proratePeriodMonths: 12,
      carryForwardLimit: null,
      encashAfterLimit: null,
      requiresSubstituteCredit: false,
      status: 'ACTIVE',
    },
    {
      name: 'Maternity Leave (Men)',
      description: 'Men: paternity leave entitlement 15 days.',
      maxDays: 15,
      isPaid: true,
      paidDays: 15,
      limitPeriod: 'LIFETIME',
      eligibilityGender: 'MALE',
      prorateOnTenure: false,
      proratePeriodMonths: 12,
      carryForwardLimit: null,
      encashAfterLimit: null,
      requiresSubstituteCredit: false,
      status: 'ACTIVE',
    },
    {
      name: 'Sick Leave',
      description:
        '12 days per year after one year tenure; prorated for less than one year. Carry forward up to 45 days and encashment threshold set at 45 days.',
      maxDays: 12,
      isPaid: true,
      paidDays: 12,
      limitPeriod: 'YEAR',
      eligibilityGender: 'ANY',
      prorateOnTenure: true,
      proratePeriodMonths: 12,
      carryForwardLimit: 45,
      encashAfterLimit: 45,
      requiresSubstituteCredit: false,
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
