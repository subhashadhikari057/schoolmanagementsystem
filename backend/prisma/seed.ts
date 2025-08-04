import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const roleNames = [
    'super_admin',
    'admin',
    'teacher',
    'student',
    'parent',
    'staff',
  ];

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
    {
      email: 'student@gmail.com',
      fullName: 'John Doe',
      password: 'student123',
      role: 'student',
    },
    {
      email: 'parent@gmail.com',
      fullName: 'Jane Doe',
      password: 'parent123',
      role: 'parent',
    },
    {
      email: 'staff@gmail.com',
      fullName: 'Staff User',
      password: 'staff123',
      role: 'staff',
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

  // 3. Create Class and Section
  const class10 = await prisma.class.upsert({
    where: { id: 'class-10-id' },
    update: {},
    create: {
      id: 'class-10-id',
      name: 'Grade 10',
    },
  });

  const sectionA = await prisma.section.upsert({
    where: { id: 'section-a-id' },
    update: {},
    create: {
      id: 'section-a-id',
      name: 'Section A',
      classId: class10.id,
    },
  });

  // 4. Create Student record linked to student user
  const studentUser = await prisma.user.findUnique({
    where: { email: 'student@gmail.com' },
  });

  if (studentUser) {
    await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        classId: class10.id,
        sectionId: sectionA.id,
        rollNumber: '001',
        dob: new Date('2008-05-15'),
        gender: 'Male',
        additionalMetadata: {},
      },
    });
  }

  // 5. Create Staff record linked to staff user
  const staffUser = await prisma.user.findUnique({
    where: { email: 'staff@gmail.com' },
  });

  if (staffUser) {
    const staff = await prisma.staff.upsert({
      where: { userId: staffUser.id },
      update: {},
      create: {
        userId: staffUser.id,
        designation: 'Administrative Assistant',
        qualification: "Bachelor's Degree",
        department: 'administration',
        experienceYears: 3,
        employmentDate: new Date('2023-01-15'),
        employmentStatus: 'active',
        salary: 35000.0,
        additionalMetadata: {},
      },
    });

    // Create staff profile
    await prisma.staffProfile.upsert({
      where: { staffId: staff.id },
      update: {},
      create: {
        staffId: staff.id,
        bio: 'Experienced administrative assistant with expertise in office management and student services.',
        emergencyContact: {
          name: 'John Smith',
          phone: '+1-555-0123',
          relationship: 'Spouse',
        },
        address: {
          street: '123 Main Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'USA',
        },
        socialLinks: {},
        additionalData: {},
      },
    });
  }

  // 6. Create Parent-Student relationship
  const parentUser = await prisma.user.findUnique({
    where: { email: 'parent@gmail.com' },
  });

  const student = await prisma.student.findUnique({
    where: { userId: studentUser?.id },
  });

  if (parentUser && student) {
    await prisma.parentStudentLink.upsert({
      where: {
        parentId_studentId: {
          parentId: parentUser.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        parentId: parentUser.id,
        studentId: student.id,
        relationship: 'Mother',
        isPrimary: true,
      },
    });
  }

  console.log(
    '✅ Seeded roles, 6 users, class, section, student, staff and parent successfully.',
  );
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
