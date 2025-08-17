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
      roles: {
        create: {
          role: {
            connect: { name: 'SUPER_ADMIN' },
          },
        },
      },
    },
  });

  // 3. Create Room
  const room = await prisma.classroom.upsert({
    where: { roomNo: '101A' },
    update: {},
    create: {
      roomNo: '101A',
    },
  });

  // 4. Create Subject
  let math = await prisma.subject.findFirst({
    where: {
      code: 'MATH',
      deletedAt: null,
    },
  });

  if (!math) {
    math = await prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH',
        maxMarks: 100,
        passMarks: 40,
      },
    });
  }

  // 5. Create Teacher User and Record
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: {
      passwordHash: await argon2.hash('password123'),
      fullName: 'John Michael Smith',
      isActive: true,
    },
    create: {
      email: 'teacher@gmail.com',
      fullName: 'John Michael Smith',
      passwordHash: await argon2.hash('password123'),
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
      employeeId: 'T-2024-0001',
      joiningDate: new Date('2020-06-01'),
      designation: 'Senior Mathematics Teacher',
      qualification: 'Master of Mathematics (M.Sc Mathematics)',
      experienceYears: 8,

      // Personal Information
      dob: new Date('1985-03-15'),
      dateOfBirth: new Date('1985-03-15'),
      gender: 'Male',
      bloodGroup: 'O+',
      maritalStatus: 'Married',
      address: 'Baneshwor-12, Kathmandu, Nepal',

      // Professional Information
      department: 'Mathematics Department',
      specialization: 'Advanced Mathematics & Statistics',
      employmentStatus: 'active',
      employmentDate: new Date('2020-06-01'),
      languagesKnown: ['English', 'Nepali', 'Hindi'],
      certifications:
        'B.Ed Mathematics, M.Ed Educational Leadership, Advanced Mathematics Certification',
      previousExperience:
        "3 years at Kathmandu Model College, 2 years at St. Xavier's School",
      // Financial Information
      basicSalary: 45000,
      allowances: 8000,
      totalSalary: 53000,

      // Bank Details (these fields exist in the Teacher model)
      bankName: 'Nepal Bank Limited',
      bankAccountNumber: '01234567890123',
      bankBranch: 'Baneshwor Branch',
      panNumber: '123456789',
      citizenshipNumber: '12-01-75-12345',
      // Additional Information
      isClassTeacher: true,
      imageUrl: '/uploads/teachers/profiles/john-smith.jpg',

      // Create teacher profile
      profile: {
        create: {
          bio: 'Experienced mathematics teacher with 8+ years of teaching experience. Specialized in advanced mathematics and statistics.',
          contactInfo: {
            phone: '9841234567',
            email: 'teacher@gmail.com',
            emergencyContact: '9841234568',
            address: 'Baneshwor-12, Kathmandu, Nepal',
          },
          additionalData: {
            specialization: 'Advanced Mathematics & Statistics',
            certifications: 'B.Ed Mathematics, M.Ed Educational Leadership',
            achievements: 'Best Teacher Award 2022, Mathematics Olympiad Coach',
            languagesKnown:
              'English (Fluent), Nepali (Native), Hindi (Conversational)',
            teachingPhilosophy:
              'Making mathematics accessible and enjoyable for all students',
            interests: {
              hobbies:
                'Reading mathematics journals, Chess, Teaching workshops',
              sports: 'Cricket, Football',
              subjects: 'Advanced Mathematics, Statistics, Physics',
            },
          },
        },
      },
    },
  });

  // 6. Create Class (now that teacher exists)
  let class10 = await prisma.class.findFirst({
    where: { grade: 10, section: 'A' },
  });

  if (!class10) {
    class10 = await prisma.class.create({
      data: {
        grade: 10,
        section: 'A',
        capacity: 30,
        // shift: 'MORNING' as const, // TODO: Re-enable once Prisma client recognizes ClassShift enum
        roomId: room.id,
        classTeacherId: teacher.id,
      },
    });
  }

  // 7. Assign Subject to Teacher and Class
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

  // 8. Create Student User and Record
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: {
      passwordHash: await argon2.hash('password123'),
      fullName: 'Arjun Kumar Sharma',
      phone: '9841333333',
      isActive: true,
      needPasswordChange: false,
    },
    create: {
      email: 'student@school.edu',
      fullName: 'Arjun Kumar Sharma',
      phone: '9841333333',
      passwordHash: await argon2.hash('password123'),
      isActive: true,
      needPasswordChange: false, // Set to true to test password change feature
      roles: {
        create: {
          role: {
            connect: { name: 'STUDENT' },
          },
        },
      },
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      classId: class10.id,
      rollNumber: '2024001',
      admissionDate: new Date('2024-04-01'),
      studentId: 'S-2024-0001',

      // Personal Information
      dob: new Date('2008-04-15'),
      dateOfBirth: new Date('2008-04-15'),
      gender: 'male',
      bloodGroup: 'O+',
      maritalStatus: 'single',

      // Contact Information
      email: studentUser.email,
      phone: studentUser.phone,

      // Address Information (direct fields, no Address model)
      address: 'Naya Bazar-15, Kathmandu, Nepal',
      street: 'Naya Bazar-15',
      city: 'Kathmandu',
      state: 'Bagmati',
      pinCode: '44600',

      // Parent Information
      fatherFirstName: 'Ram',
      fatherMiddleName: 'Bahadur',
      fatherLastName: 'Sharma',
      motherFirstName: 'Sita',
      motherMiddleName: 'Devi',
      motherLastName: 'Sharma',
      fatherPhone: '9841111111',
      motherPhone: '9841222222',
      fatherEmail: 'father@example.com',
      motherEmail: 'mother@example.com',
      fatherOccupation: 'Business Owner',
      motherOccupation: 'Teacher',

      // Academic Status
      academicStatus: 'active',
      feeStatus: 'paid',
      transportMode: 'school_bus',

      // Medical Information
      medicalConditions: 'None',
      allergies: 'None',

      // Additional Information
      interests: 'Mathematics, Football, Reading',
      specialNeeds: 'None',

      // Create student profile
      profile: {
        create: {
          emergencyContact: {
            name: 'Uncle Krishna',
            phone: '9841444444',
            relationship: 'uncle',
          },
          interests: {
            hobbies: 'Football, Mathematics, Science',
            sports: 'Football, Cricket',
            subjects: 'Mathematics, Science',
          },
          additionalData: {
            medicalConditions: 'None',
            allergies: 'None',
            specialNeeds: 'None',
            bio: 'Bright student with interest in mathematics and sports',
          },
        },
      },
    },
  });

  // 9. Create Parent Users and Links
  // Father
  const fatherUser = await prisma.user.upsert({
    where: { email: 'father@example.com' },
    update: {
      passwordHash: await argon2.hash('password123'),
      fullName: 'Ram Bahadur Sharma',
      phone: '9841111111',
      isActive: true,
      needPasswordChange: false,
    },
    create: {
      email: 'father@example.com',
      fullName: 'Ram Bahadur Sharma',
      phone: '9841111111',
      passwordHash: await argon2.hash('password123'),
      isActive: true,
      needPasswordChange: false, // Set to true to test password change feature
      roles: {
        create: {
          role: {
            connect: { name: 'PARENT' },
          },
        },
      },
    },
  });

  const father = await prisma.parent.upsert({
    where: { userId: fatherUser.id },
    update: {},
    create: {
      userId: fatherUser.id,
      dateOfBirth: new Date('1975-08-20'),
      gender: 'male',
      occupation: 'Business Owner',
      workPlace: 'Local Trading Company',
      workPhone: '014567890',
      street: 'Naya Bazar-15',
      city: 'Kathmandu',
      state: 'Bagmati',
      pinCode: '44600',
      country: 'Nepal',
      notes: 'Primary contact for student',
      profile: {
        create: {
          bio: 'Local businessman and active parent',
          additionalData: {
            relationship: 'father',
            isPrimary: true,
          },
        },
      },
    },
  });

  // Mother
  const motherUser = await prisma.user.upsert({
    where: { email: 'mother@example.com' },
    update: {
      passwordHash: await argon2.hash('password123'),
      fullName: 'Sita Devi Sharma',
      phone: '9841222222',
      isActive: true,
      needPasswordChange: false,
    },
    create: {
      email: 'mother@example.com',
      fullName: 'Sita Devi Sharma',
      phone: '9841222222',
      passwordHash: await argon2.hash('password123'),
      isActive: true,
      needPasswordChange: false, // Set to true to test password change feature
      roles: {
        create: {
          role: {
            connect: { name: 'PARENT' },
          },
        },
      },
    },
  });

  const mother = await prisma.parent.upsert({
    where: { userId: motherUser.id },
    update: {},
    create: {
      userId: motherUser.id,
      dateOfBirth: new Date('1978-12-10'),
      gender: 'female',
      occupation: 'Teacher',
      workPlace: 'Local Primary School',
      workPhone: '014567891',
      street: 'Naya Bazar-15',
      city: 'Kathmandu',
      state: 'Bagmati',
      pinCode: '44600',
      country: 'Nepal',
      notes: 'Secondary contact for student',
      profile: {
        create: {
          bio: 'Primary school teacher and caring mother',
          additionalData: {
            relationship: 'mother',
            isPrimary: false,
          },
        },
      },
    },
  });

  // Create Parent-Student links
  await prisma.parentStudentLink.upsert({
    where: {
      parentId_studentId: {
        parentId: father.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      parentId: father.id,
      studentId: student.id,
      relationship: 'father',
      isPrimary: true,
    },
  });

  await prisma.parentStudentLink.upsert({
    where: {
      parentId_studentId: {
        parentId: mother.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      parentId: mother.id,
      studentId: student.id,
      relationship: 'mother',
      isPrimary: false,
    },
  });

  // Create Guardian (non-user account)
  await prisma.guardian.create({
    data: {
      studentId: student.id,
      fullName: 'Krishna Sharma',
      phone: '9841444444',
      email: 'krishna@example.com',
      relation: 'uncle',
    },
  });

  // 10. Create ID Card for Student
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

  console.log('✅ Comprehensive seed data created successfully!');
  console.log('');
  console.log('🔐 TEST CREDENTIALS:');
  console.log('');
  console.log('👨‍💼 SUPER ADMIN:');
  console.log('  Email: superadmin@gmail.com');
  console.log('  Password: password123');
  console.log('');
  console.log('🧑‍🏫 TEACHER:');
  console.log('  Email: teacher@gmail.com');
  console.log('  Password: password123');
  console.log('  - John Smith (T-2024-0001)');
  console.log('  - Senior Mathematics Teacher with all fields populated');
  console.log('  - Bank details, certifications, experience included');
  console.log('');
  console.log('🎓 STUDENT:');
  console.log('  Email: student@school.edu');
  console.log('  Password: password123');
  console.log('  - Arjun Sharma (S-2024-0001)');
  console.log('  - Complete profile with medical, academic info');
  console.log('  - Note: Ready for direct login (needPasswordChange: false)');
  console.log('');
  console.log('👨‍👩‍👧‍👦 PARENTS:');
  console.log('  Father: father@example.com / password123');
  console.log('    - Ram Bahadur Sharma, Business Owner');
  console.log('  Mother: mother@example.com / password123');
  console.log('    - Sita Devi Sharma, Teacher');
  console.log('  - Note: Ready for direct login (needPasswordChange: false)');
  console.log('');
  console.log('📚 COMPREHENSIVE DATA CREATED:');
  console.log('  - 1 Teacher with ALL schema fields populated');
  console.log('  - 1 Student with complete profile');
  console.log('  - 2 Parents with user accounts');
  console.log('  - 1 Guardian (non-user account)');
  console.log('  - Complete parent-student relationships');
  console.log('  - ID Cards and class assignments');
  console.log('');
  console.log('🔧 TESTING NOTES:');
  console.log('  - All users can login directly with password123');
  console.log(
    '  - To test password change feature: set needPasswordChange: true in seed',
  );
  console.log('  - Password change flow will be enforced on first login');
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
