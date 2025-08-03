import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const roleNames = ['super_admin', 'admin', 'teacher', 'student', 'parent'];

  // 1. Create roles
  for (const role of roleNames) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: {
        name: role,
        description: `${role} role`,
        isSystemRole: role === 'super_admin',
      },
    });
  }

  // 2. Create users and assign roles
  const users = [
    {
      email: 'superadmin@gmail.com',
      fullName: 'Super Admin',
      password: 'superadmin123',
      role: 'super_admin',
    },
    {
      email: 'admin@gmail.com',
      fullName: 'Admin User',
      password: 'admin123',
      role: 'admin',
    },
    {
      email: 'teacher@gmail.com',
      fullName: 'Teacher User',
      password: 'teacher123',
      role: 'teacher',
    },
  ];

  for (const user of users) {
    const passwordHash = await argon2.hash(user.password, {
      type: argon2.argon2id,
    });

    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        fullName: user.fullName,
        passwordHash,
        isActive: true,
      },
    });

    const role = await prisma.role.findUnique({ where: { name: user.role } });

    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdUser.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: createdUser.id,
          roleId: role.id,
        },
      });
    }
  }

  console.log('✅ Seeded roles and 3 users successfully.');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
