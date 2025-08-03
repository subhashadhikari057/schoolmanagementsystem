import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/auth/hash.util';
import { UserRole } from '@sms/shared-types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2024-2025' },
    update: {},
    create: {
      name: '2024-2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isActive: true,
      isCurrent: true,
    },
  });

  console.log('✅ Academic year created:', academicYear.name);

  // Create Roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: UserRole.SUPER_ADMIN },
      update: {},
      create: {
        name: UserRole.SUPER_ADMIN,
        description: 'Super Administrator with full system access',
        isSystemRole: true,
      },
    }),
    prisma.role.upsert({
      where: { name: UserRole.ADMIN },
      update: {},
      create: {
        name: UserRole.ADMIN,
        description: 'School Administrator',
        isSystemRole: true,
      },
    }),
    prisma.role.upsert({
      where: { name: UserRole.TEACHER },
      update: {},
      create: {
        name: UserRole.TEACHER,
        description: 'Teacher with access to academic features',
        isSystemRole: true,
      },
    }),
    prisma.role.upsert({
      where: { name: UserRole.STUDENT },
      update: {},
      create: {
        name: UserRole.STUDENT,
        description: 'Student with limited access',
        isSystemRole: true,
      },
    }),
    prisma.role.upsert({
      where: { name: UserRole.PARENT },
      update: {},
      create: {
        name: UserRole.PARENT,
        description: 'Parent with access to child information',
        isSystemRole: true,
      },
    }),
  ]);

  console.log(
    '✅ Roles created:',
    roles.map(r => r.name),
  );

  // Create Classes and Sections
  const class10 = await prisma.class.create({
    data: {
      name: 'Grade 10',
    },
  });

  // Removed unused class9 variable
  await prisma.class.create({
    data: {
      name: 'Grade 9',
    },
  });

  const sectionA = await prisma.section.create({
    data: {
      name: 'A',
      classId: class10.id,
    },
  });

  // Removed unused sectionB variable
  await prisma.section.create({
    data: {
      name: 'B',
      classId: class10.id,
    },
  });

  console.log('✅ Classes and sections created');

  // Create Subjects
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { code: 'MATH' },
      update: {},
      create: {
        name: 'Mathematics',
        code: 'MATH',
        description: 'Mathematics subject',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'SCI' },
      update: {},
      create: {
        name: 'Science',
        code: 'SCI',
        description: 'Science subject',
      },
    }),
    prisma.subject.upsert({
      where: { code: 'ENG' },
      update: {},
      create: {
        name: 'English',
        code: 'ENG',
        description: 'English subject',
      },
    }),
  ]);

  console.log(
    '✅ Subjects created:',
    subjects.map(s => s.name),
  );

  // Create Test Users
  const superAdminPassword = await hashPassword('SuperAdmin@123');
  const adminPassword = await hashPassword('Admin@123');
  const teacherPassword = await hashPassword('Teacher@123');
  const studentPassword = await hashPassword('Student@123');
  const parentPassword = await hashPassword('Parent@123');

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@school.com' },
    update: {},
    create: {
      email: 'superadmin@school.com',
      phone: '+1234567890',
      passwordHash: superAdminPassword,
      fullName: 'Super Administrator',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: roles[0].id } },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: roles[0].id,
    },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      phone: '+1234567891',
      passwordHash: adminPassword,
      fullName: 'School Administrator',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roles[1].id } },
    update: {},
    create: {
      userId: admin.id,
      roleId: roles[1].id,
    },
  });

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      email: 'teacher@school.com',
      phone: '+1234567892',
      passwordHash: teacherPassword,
      fullName: 'John Teacher',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: teacher.id, roleId: roles[2].id } },
    update: {},
    create: {
      userId: teacher.id,
      roleId: roles[2].id,
    },
  });

  // Create Teacher profile
  const teacherProfile = await prisma.teacher.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      designation: 'Senior Teacher',
      qualification: 'M.Sc Mathematics',
      employmentDate: new Date('2020-01-01'),
      department: 'Mathematics',
    },
  });

  // Assign subjects to teacher
  await prisma.teacherSubject.upsert({
    where: {
      teacherId_subjectId: {
        teacherId: teacherProfile.id,
        subjectId: subjects[0].id,
      },
    },
    update: {},
    create: {
      teacherId: teacherProfile.id,
      subjectId: subjects[0].id,
    },
  });

  // Parent
  const parent = await prisma.user.upsert({
    where: { email: 'parent@school.com' },
    update: {},
    create: {
      email: 'parent@school.com',
      phone: '+1234567893',
      passwordHash: parentPassword,
      fullName: 'Jane Parent',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: parent.id, roleId: roles[4].id } },
    update: {},
    create: {
      userId: parent.id,
      roleId: roles[4].id,
    },
  });

  // Student
  const student = await prisma.user.upsert({
    where: { email: 'student@school.com' },
    update: {},
    create: {
      email: 'student@school.com',
      phone: '+1234567894',
      passwordHash: studentPassword,
      fullName: 'Alex Student',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: student.id, roleId: roles[3].id } },
    update: {},
    create: {
      userId: student.id,
      roleId: roles[3].id,
    },
  });

  // Create Student profile
  const studentProfile = await prisma.student.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      classId: class10.id,
      sectionId: sectionA.id,
      rollNumber: '001',
      dob: new Date('2008-01-01'),
      gender: 'male',
    },
  });

  // Link parent to student
  await prisma.parentStudentLink.upsert({
    where: {
      parentId_studentId: { parentId: parent.id, studentId: studentProfile.id },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: studentProfile.id,
      relationship: 'mother',
      isPrimary: true,
    },
  });

  console.log('✅ Test users created successfully!');
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('');
  console.log('Super Admin:');
  console.log('  Email: superadmin@school.com');
  console.log('  Password: SuperAdmin@123');
  console.log('');
  console.log('Admin:');
  console.log('  Email: admin@school.com');
  console.log('  Password: Admin@123');
  console.log('');
  console.log('Teacher:');
  console.log('  Email: teacher@school.com');
  console.log('  Password: Teacher@123');
  console.log('');
  console.log('Parent:');
  console.log('  Email: parent@school.com');
  console.log('  Password: Parent@123');
  console.log('');
  console.log('Student:');
  console.log('  Email: student@school.com');
  console.log('  Password: Student@123');
  console.log('');
  console.log('🎯 All users can login with their email or phone number!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
