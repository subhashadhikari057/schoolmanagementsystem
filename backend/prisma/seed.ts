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

  let class10 = await prisma.class.findFirst({
    where: { grade: 10, section: 'A' },
  });

  if (!class10) {
    class10 = await prisma.class.create({
      data: {
        grade: 10,
        section: 'A',
        capacity: 30,
        roomId: room.id,
      },
    });
  }

  // 4. Create Subject
  const math = await prisma.subject.upsert({
    where: { code: 'MATH' },
    update: {},
    create: {
      name: 'Mathematics',
      code: 'MATH',
      maxMarks: 100,
      passMarks: 40,
    },
  });

  // 5. Create Teacher User and Record
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: {},
    create: {
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

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
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
  await prisma.classSubject.upsert({
    where: {
      classId_subjectId: {
        classId: class10.id,
        subjectId: math.id,
      },
    },
    update: {
      teacherId: teacher.id,
    },
    create: {
      classId: class10.id,
      subjectId: math.id,
      teacherId: teacher.id,
    },
  });

  // 7. Create Student User and Record
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@gmail.com' },
    update: {},
    create: {
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

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
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
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@gmail.com' },
    update: {},
    create: {
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

  // Create Parent profile
  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      occupation: 'Business Owner',
      street: 'Naya Bazar',
      city: 'Kathmandu',
      state: 'Bagmati',
      pinCode: '44600',
      country: 'Nepal',
    },
  });

  // Create Parent-Student link
  const existingLink = await prisma.parentStudentLink.findFirst({
    where: {
      parentId: parent.id,
      studentId: student.id,
    },
  });

  if (!existingLink) {
    await prisma.parentStudentLink.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        isPrimary: true,
        relationship: 'father',
      },
    });
  }

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
