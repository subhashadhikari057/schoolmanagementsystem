import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const roleNames = [
    'SUPER_ADMIN',
    'ADMIN',
    'ACCOUNTANT',
    'TEACHER',
    'STUDENT',
    'PARENT',
    'STAFF',
  ];

  // 1. Create roles
  for (const role of roleNames) {
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

  // 2. Create users and assign roles
  const users = [
    {
      email: 'superadmin@gmail.com',
      fullName: 'Super Admin',
      password: 'superadmin123',
      role: 'SUPER_ADMIN',
    },
    {
      email: 'admin@gmail.com',
      fullName: 'Admin User',
      password: 'admin123',
      role: 'ADMIN',
    },
    {
      email: 'teacher@gmail.com',
      fullName: 'Teacher User',
      password: 'teacher123',
      role: 'TEACHER',
    },
    {
      email: 'student@gmail.com',
      fullName: 'John Doe',
      password: 'student123',
      role: 'STUDENT',
    },
    {
      email: 'parent@gmail.com',
      fullName: 'Jane Doe',
      password: 'parent123',
      role: 'PARENT',
    },
    {
      email: 'staff@gmail.com',
      fullName: 'Staff User',
      password: 'staff123',
      role: 'STAFF',
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

  // 8. Create sample subjects
  const subjects = [
    {
      name: 'Mathematics',
      code: 'MATH',
      description: 'Mathematical concepts and problem solving',
    },
    {
      name: 'Physics',
      code: 'PHY',
      description: 'Laws of physics and scientific principles',
    },
    {
      name: 'Chemistry',
      code: 'CHEM',
      description: 'Chemical reactions and properties',
    },
    {
      name: 'Biology',
      code: 'BIO',
      description: 'Life sciences and biological processes',
    },
    {
      name: 'English',
      code: 'ENG',
      description: 'Language arts and literature',
    },
    {
      name: 'History',
      code: 'HIST',
      description: 'Historical events and analysis',
    },
  ];

  const createdSubjects = [];
  for (const subject of subjects) {
    const createdSubject = await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: {
        name: subject.name,
        code: subject.code,
        description: subject.description,
        createdById: superAdminUser.id,
      },
    });
    createdSubjects.push(createdSubject);
  }

  // 9. Create sample teachers
  const teachers = [
    {
      fullName: 'Dr. Sarah Mitchell',
      email: 'sarah.mitchell@school.edu',
      phone: '+1555123456',
      employeeId: 'EMP001',
      designation: 'Senior Teacher',
      department: 'Mathematics',
      qualification: 'PhD in Mathematics',
      specialization: 'Advanced Mathematics',
      experienceYears: 15,
      basicSalary: 75000,
      allowances: 5000,
      totalSalary: 80000,
    },
    {
      fullName: 'Prof. Michael Chen',
      email: 'michael.chen@school.edu',
      phone: '+1555234567',
      employeeId: 'EMP002',
      designation: 'Teacher',
      department: 'Science',
      qualification: 'MSc Physics',
      specialization: 'Physics',
      experienceYears: 8,
      basicSalary: 68000,
      allowances: 4000,
      totalSalary: 72000,
    },
    {
      fullName: 'Ms. Emma Thompson',
      email: 'emma.thompson@school.edu',
      phone: '+1555345678',
      employeeId: 'EMP003',
      designation: 'Assistant Teacher',
      department: 'English',
      qualification: 'MA English Literature',
      specialization: 'Literature',
      experienceYears: 5,
      basicSalary: 58000,
      allowances: 3000,
      totalSalary: 61000,
    },
  ];

  const createdTeachers = [];
  for (const teacherData of teachers) {
    // Create user for teacher
    const teacherUser = await prisma.user.upsert({
      where: { email: teacherData.email },
      update: {},
      create: {
        email: teacherData.email,
        phone: teacherData.phone,
        fullName: teacherData.fullName,
        passwordHash: await import('bcrypt').then(bcrypt =>
          bcrypt.hash('teacher123', 10),
        ),
        needPasswordChange: true,
        createdById: superAdminUser.id,
        roles: {
          create: {
            role: { connect: { name: 'TEACHER' } },
          },
        },
      },
    });

    // Create teacher record
    const teacher = await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        employeeId: teacherData.employeeId,
        designation: teacherData.designation,
        qualification: teacherData.qualification,
        specialization: teacherData.specialization,
        department: teacherData.department,
        experienceYears: teacherData.experienceYears,
        employmentDate: new Date(),
        basicSalary: teacherData.basicSalary,
        allowances: teacherData.allowances,
        totalSalary: teacherData.totalSalary,
        createdById: superAdminUser.id,
        profile: {
          create: {
            bio: `Experienced ${teacherData.department} teacher with ${teacherData.experienceYears} years of teaching experience.`,
            contactInfo: {
              phone: teacherData.phone,
              email: teacherData.email,
            },
            socialLinks: {},
            createdById: superAdminUser.id,
          },
        },
      },
    });

    createdTeachers.push(teacher);
  }

  // Assign subjects to teachers
  if (createdTeachers.length > 0 && createdSubjects.length > 0) {
    // Math teacher gets Math subject
    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId: {
          teacherId: createdTeachers[0].id,
          subjectId: createdSubjects[0].id, // Mathematics
        },
      },
      update: {},
      create: {
        teacherId: createdTeachers[0].id,
        subjectId: createdSubjects[0].id,
        createdById: superAdminUser.id,
      },
    });

    // Science teacher gets Physics and Chemistry
    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId: {
          teacherId: createdTeachers[1].id,
          subjectId: createdSubjects[1].id, // Physics
        },
      },
      update: {},
      create: {
        teacherId: createdTeachers[1].id,
        subjectId: createdSubjects[1].id,
        createdById: superAdminUser.id,
      },
    });

    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId: {
          teacherId: createdTeachers[1].id,
          subjectId: createdSubjects[2].id, // Chemistry
        },
      },
      update: {},
      create: {
        teacherId: createdTeachers[1].id,
        subjectId: createdSubjects[2].id,
        createdById: superAdminUser.id,
      },
    });

    // English teacher gets English subject
    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId: {
          teacherId: createdTeachers[2].id,
          subjectId: createdSubjects[4].id, // English
        },
      },
      update: {},
      create: {
        teacherId: createdTeachers[2].id,
        subjectId: createdSubjects[4].id,
        createdById: superAdminUser.id,
      },
    });
  }

  console.log(
    '✅ Seeded roles, 6 users, class, section, student, staff, parent, subjects, and 3 teachers successfully.',
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
