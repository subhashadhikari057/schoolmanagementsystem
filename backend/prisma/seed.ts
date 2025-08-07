// prisma/seed.ts - Extended Seed File Compatible with Your Redesigned Schema

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Roles
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
  const passwordHash = await argon2.hash('superadmin123');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: {},
    create: {
      email: 'superadmin@gmail.com',
      fullName: 'Super Admin',
      passwordHash,
      roles: {
        create: {
          role: {
            connect: { name: 'SUPER_ADMIN' },
          },
        },
      },
    },
  });

  // 3. Create Room and Class
  const room = await prisma.classroom.upsert({
    where: { roomNo: '101A' },
    update: {},
    create: {
      roomNo: '101A',
    },
  });

  const class10 = await prisma.class.create({
    data: {
      grade: 10,
      section: 'A',
      capacity: 30,
      roomId: room.id,
    },
  });

  // 4. Create Subject
  const math = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MATH',
      maxMarks: 100,
      passMarks: 40,
    },
  });

  // 5. Create Teacher User and Record
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@gmail.com',
      fullName: 'Teacher User',
      passwordHash: await argon2.hash('teacher123'),
      roles: {
        create: {
          role: {
            connect: { name: 'TEACHER' },
          },
        },
      },
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      joiningDate: new Date(),
      designation: 'Mathematics Teacher',
      qualification: 'MSc Mathematics',
      experienceYears: 5,
      basicSalary: 60000,
      allowances: 5000,
      totalSalary: 65000,
      dob: new Date('1990-05-10'),
      gender: 'Female',
      maritalStatus: 'Single',
    },
  });

  // 6. Assign Subject to Teacher and Class
  await prisma.classSubject.create({
    data: {
      classId: class10.id,
      subjectId: math.id,
      teacherId: teacher.id,
    },
  });

  // 7. Create Student User and Record
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@gmail.com',
      fullName: 'John Doe',
      passwordHash: await argon2.hash('student123'),
      roles: {
        create: {
          role: {
            connect: { name: 'STUDENT' },
          },
        },
      },
    },
  });

  // Create address first
  const address = await prisma.address.create({
    data: {
      street: 'Naya Bazar',
      city: 'Kathmandu',
      state: 'Bagmati',
      pinCode: '44600',
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      classId: class10.id,
      rollNumber: '001',
      dob: new Date('2008-04-15'),
      gender: 'Male',
      admissionDate: new Date('2023-04-01'),
      email: studentUser.email,
      fatherName: 'Ram Bahadur',
      motherName: 'Sita Devi',
      fatherEmail: 'ram@example.com',
      motherEmail: 'sita@example.com',
      addressId: address.id,
    },
  });

  // 8. Create Parent User and Link
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@gmail.com',
      fullName: 'Parent User',
      passwordHash: await argon2.hash('parent123'),
      roles: {
        create: {
          role: {
            connect: { name: 'PARENT' },
          },
        },
      },
    },
  });

  await prisma.parentStudentLink.create({
    data: {
      parentId: parentUser.id,
      studentId: student.id,
      isPrimary: true,
      relationship: 'Father',
    },
  });

  // 9. Create ID Card for Student
  const idTemplate = await prisma.iDCardTemplate.create({
    data: {
      name: 'Default Student Template',
      layout: {},
    },
  });

  await prisma.iDCard.create({
    data: {
      type: 'Student',
      templateId: idTemplate.id,
      expiryDate: new Date('2026-01-01'),
      issuedForId: studentUser.id,
    },
  });

  console.log('✅ Extended seed data created successfully.');
}

main()
  .catch(e => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
