// prisma/seed.ts - Simplified Seed File with Admin Login Only

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

  console.log('✅ Admin seed data created successfully!');
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
