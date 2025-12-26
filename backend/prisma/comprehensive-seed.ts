/**
 * =============================================================================
 * COMPREHENSIVE SECONDARY SEED FILE
 * =============================================================================
 * This file creates a complete test dataset including:
 * - Users of all types (Students, Parents, Teachers, Staff)
 * - Classes and Subjects with assignments
 * - Calendar Events of all types (HOLIDAY, EVENT, EXAM, EMERGENCY_CLOSURE)
 * - Notices and Complaints
 * - Multiple rooms and classrooms
 * =============================================================================
 */

/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function ensureRole(name: string, description?: string) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: {
      name,
      description: description || `${name} role`,
      isSystemRole: true,
    },
  });
}

// Helper function to generate random dates
function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function main() {
  console.log('🌱 Starting comprehensive secondary seed...');

  // Check if data already exists
  const existingClassrooms = await prisma.classroom.count();
  if (existingClassrooms > 0) {
    console.log('⚠️  Data already exists. Skipping comprehensive seed.');
    console.log(
      '💡 To reset and re-seed, run: npm run db:reset && npm run db:seed && npm run db:seed:comprehensive',
    );
    return;
  }

  // Ensure core roles exist
  const [teacherRole, staffRole, parentRole, studentRole] = await Promise.all([
    ensureRole('TEACHER'),
    ensureRole('STAFF'),
    ensureRole('PARENT'),
    ensureRole('STUDENT'),
  ]);

  // =========================================================================
  // 0. CREATE SCHOOL INFORMATION
  // =========================================================================
  console.log('🏫 Creating school information...');

  const schoolInfoData = {
    schoolName: 'Evergreen Public School',
    schoolCode: 'IEMIS-0001',
    establishedYear: 1995,
    address: 'Kathmandu Metropolitan City, Ward 1, Bagmati Province, Nepal',
    website: 'https://evergreen.edu.np',
    emails: ['info@evergreen.edu.np', 'contact@evergreen.edu.np'],
    contactNumbers: ['9800000000', '9800000001'],
    province: 'Bagmati',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan City',
    ward: '1',
    schoolClassification: 'Community',
    schoolType: 'Secondary',
    classRegisteredUpto: 'Grade 12',
    seeCode: 'SEE12345',
    hsebCode: 'HSEB67890',
    phoneNumber: '01-5555555',
    email: 'office@evergreen.edu.np',
    bank: 'Nepal Bank Limited',
    accountNumber: '00123456789',
    panNumber: '123456789',
    headTeacherName: 'Dinesh Adhikari',
    headTeacherContactNumber: '9801234567',
    headTeacherQualification: 'M.Ed',
    headTeacherGender: 'Male',
    headTeacherIsTeaching: true,
    headTeacherCaste: 'Brahmin',
    grantReceivingFrom: 'Government of Nepal',
    latitude: 27.7172,
    longitude: 85.324,
    elevation: 1400,
    hasEcdLevel: true,
    hasBasicLevel1To5: true,
    hasBasicLevel6To8: true,
    ecdApprovalDate: new Date('2000-04-01'),
    primaryApprovalDate: new Date('2002-04-01'),
    lowerSecondaryApprovalDate: new Date('2005-04-01'),
    runningEcdPpc: true,
    runningGrade1: true,
    runningGrade2: true,
    runningGrade3: true,
    runningGrade4: true,
    runningGrade5: true,
    runningGrade6: true,
    runningGrade7: true,
    runningGrade8: true,
    runningGrade9: true,
    runningGrade10: true,
    runningGrade11: true,
    runningGrade12: true,
    scienceSubjectTaughtIn11And12: true,
    selectedForModelSchool: true,
    complaintHearingMechanism: true,
    foreignAffiliation: false,
    informalSchool: false,
    mobileSchool: false,
    openSchool: false,
    specialDisabilitySchool: false,
    multilingualEducation: true,
    mgmlImplemented: false,
    residentialScholarshipProgram: false,
    zeroPositionGrantBasicSchool: false,
    technicalStreamRunning: true,
  };

  await prisma.schoolInformation.upsert({
    where: { schoolCode: schoolInfoData.schoolCode },
    update: { ...schoolInfoData },
    create: { ...schoolInfoData },
  });

  // =========================================================================
  // 1. CREATE CLASSROOMS AND ROOMS
  // =========================================================================
  console.log('🏫 Creating classrooms and rooms...');

  const classroomIds: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const classroom = await prisma.classroom.create({
      data: {
        roomNo: `R-${i.toString().padStart(3, '0')}`,
        name: `Classroom ${i}`,
        capacity: i <= 8 ? 30 : 35,
        floor: Math.ceil(i / 5),
        building: i <= 8 ? 'Main Building' : 'Secondary Building',
        note: `Standard classroom with projector and whiteboard`,
        status: 'active',
        isAvailable: true,
      },
    });
    classroomIds.push(classroom.id);
  }

  // Special rooms
  const specialRooms = [
    { roomNo: 'LAB-001', name: 'Computer Lab', capacity: 25 },
    { roomNo: 'LAB-002', name: 'Science Lab', capacity: 20 },
    { roomNo: 'LIB-001', name: 'Main Library', capacity: 100 },
    { roomNo: 'AUD-001', name: 'Main Auditorium', capacity: 300 },
    { roomNo: 'GYM-001', name: 'Gymnasium', capacity: 50 },
  ];

  for (const room of specialRooms) {
    const specialRoom = await prisma.classroom.create({
      data: {
        ...room,
        floor: 1,
        building: 'Main Building',
        note: `Special purpose room`,
        status: 'active',
        isAvailable: true,
      },
    });
    classroomIds.push(specialRoom.id);
  }

  // =========================================================================
  // 2. CREATE SUBJECTS
  // =========================================================================
  console.log('📚 Creating subjects...');

  const subjectsData = [
    { name: 'Mathematics', code: 'MATH', maxMarks: 100, passMarks: 35 },
    { name: 'English', code: 'ENG', maxMarks: 100, passMarks: 35 },
    { name: 'Nepali', code: 'NEP', maxMarks: 100, passMarks: 35 },
    { name: 'Science', code: 'SCI', maxMarks: 100, passMarks: 35 },
    { name: 'Social Studies', code: 'SOC', maxMarks: 100, passMarks: 35 },
    { name: 'Physics', code: 'PHY', maxMarks: 100, passMarks: 35 },
    { name: 'Chemistry', code: 'CHEM', maxMarks: 100, passMarks: 35 },
    { name: 'Biology', code: 'BIO', maxMarks: 100, passMarks: 35 },
    { name: 'Computer Science', code: 'CS', maxMarks: 100, passMarks: 35 },
    { name: 'Physical Education', code: 'PE', maxMarks: 50, passMarks: 20 },
  ];

  const subjectIds: string[] = [];
  for (const subjectData of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        ...subjectData,
        description: `${subjectData.name} curriculum as per national standards`,
      },
    });
    subjectIds.push(subject.id);
  }

  // =========================================================================
  // 3. CREATE TEACHER USERS AND PROFILES
  // =========================================================================
  console.log('👨‍🏫 Creating teachers...');

  const teachersData = [
    {
      name: 'Dr. Rajesh Sharma',
      email: 'rajesh.sharma@school.edu',
      designation: 'Principal',
      department: 'Administration',
    },
    {
      name: 'Prof. Sita Devi',
      email: 'sita.devi@school.edu',
      designation: 'Vice Principal',
      department: 'Academic',
    },
    {
      name: 'Mr. Ramesh Thapa',
      email: 'ramesh.thapa@school.edu',
      designation: 'Senior Teacher',
      department: 'Mathematics',
    },
    {
      name: 'Ms. Geeta Acharya',
      email: 'geeta.acharya@school.edu',
      designation: 'Senior Teacher',
      department: 'English',
    },
    {
      name: 'Dr. Krishna Bahadur',
      email: 'krishna.bahadur@school.edu',
      designation: 'Head of Science',
      department: 'Science',
    },
    {
      name: 'Mrs. Kamala Shrestha',
      email: 'kamala.shrestha@school.edu',
      designation: 'Teacher',
      department: 'Science',
    },
    {
      name: 'Mr. Bikash Koirala',
      email: 'bikash.koirala@school.edu',
      designation: 'Computer Teacher',
      department: 'Technology',
    },
    {
      name: 'Ms. Sunita Rana',
      email: 'sunita.rana@school.edu',
      designation: 'Teacher',
      department: 'Social Studies',
    },
    {
      name: 'Mr. Nabin Ghimire',
      email: 'nabin.ghimire@school.edu',
      designation: 'Teacher',
      department: 'Language',
    },
    {
      name: 'Mrs. Asha Karki',
      email: 'asha.karki@school.edu',
      designation: 'Primary Teacher',
      department: 'Primary Education',
    },
  ];

  const teacherIds: string[] = [];
  const teacherRoleId = teacherRole.id;

  for (let i = 0; i < teachersData.length; i++) {
    const teacherData = teachersData[i];
    const passwordHash = await argon2.hash('teacher123');

    // Create user
    const user = await prisma.user.create({
      data: {
        email: teacherData.email,
        fullName: teacherData.name,
        passwordHash,
        phone: `98${(81000000 + i).toString()}`,
        isActive: true,
        roles: {
          create: {
            roleId: teacherRoleId,
          },
        },
      },
    });

    // Create teacher
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId: `TCH${(i + 1).toString().padStart(3, '0')}`,
        joiningDate: randomDate(new Date('2020-01-01'), new Date('2024-01-01')),
        experienceYears: 5 + i,
        qualification: i < 3 ? 'Ph.D.' : i < 6 ? 'Masters' : 'Bachelors',
        designation: teacherData.designation,
        dob: randomDate(new Date('1975-01-01'), new Date('1990-01-01')),
        gender: i % 3 === 0 ? 'Male' : 'Female',
        bloodGroup: ['A+', 'B+', 'AB+', 'O+'][i % 4],
        maritalStatus: i % 4 === 0 ? 'Single' : 'Married',
        department: teacherData.department,
        employmentStatus: 'active',
        basicSalary: 50000 + i * 2000,
        allowances: 10000 + i * 500,
        totalSalary: 60000 + i * 2500,
        isClassTeacher: i < 8,
        languagesKnown: ['English', 'Nepali'],
        address: `${teacherData.name.split(' ')[0]} Marg, Kathmandu`,
        bankAccountNumber: `123456789${i.toString().padStart(2, '0')}`,
        bankName: 'Nepal Bank Limited',
        bankBranch: 'Kathmandu Branch',
      },
    });

    // Create teacher profile
    await prisma.teacherProfile.create({
      data: {
        teacherId: teacher.id,
        bio: `Experienced ${teacherData.designation} with expertise in ${teacherData.department}`,
        contactInfo: {
          email: teacherData.email,
          phone: user.phone,
        },
      },
    });

    teacherIds.push(teacher.id);
  }

  // =========================================================================
  // 4. CREATE CLASSES
  // =========================================================================
  console.log('🎓 Creating classes...');

  const classIds: string[] = [];
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sections = ['A', 'B'];

  let classIndex = 0;
  for (const grade of grades) {
    for (const section of sections) {
      const capacity = grade <= 5 ? 25 : 30;
      const currentClassroom = classroomIds[classIndex % classroomIds.length];
      const classTeacher = teacherIds[classIndex % teacherIds.length];

      const classData = await prisma.class.create({
        data: {
          name: `Grade ${grade} - Section ${section}`,
          grade,
          section,
          capacity,
          currentEnrollment: 0,
          shift: grade <= 5 ? 'MORNING' : 'DAY',
          status: 'active',
          roomId: currentClassroom,
          classTeacherId: classTeacher,
        },
      });

      classIds.push(classData.id);
      classIndex++;
    }
  }

  // =========================================================================
  // 5. CREATE STAFF USERS AND PROFILES
  // =========================================================================
  console.log('👥 Creating staff members...');

  const staffData = [
    {
      name: 'Mr. Gopal Adhikari',
      email: 'gopal.adhikari@school.edu',
      designation: 'Office Manager',
      department: 'Administration',
      hasAccount: true,
    },
    {
      name: 'Mrs. Mina Basnet',
      email: 'mina.basnet@school.edu',
      designation: 'Accountant',
      department: 'Finance',
      hasAccount: true,
    },
    {
      name: 'Mr. Suresh Paudel',
      email: 'suresh.paudel@school.edu',
      designation: 'IT Support',
      department: 'Technology',
      hasAccount: true,
    },
    {
      name: 'Ms. Nisha Tamang',
      email: 'nisha.tamang@school.edu',
      designation: 'Librarian',
      department: 'Library',
      hasAccount: true,
    },
    {
      name: 'Mr. Hari Subedi',
      email: 'hari.subedi@school.edu',
      designation: 'Security Guard',
      department: 'Security',
      hasAccount: false,
    },
    {
      name: 'Mrs. Devi Thapa',
      email: 'devi.thapa@school.edu',
      designation: 'Cleaner',
      department: 'Maintenance',
      hasAccount: false,
    },
  ];

  const staffRoleId = staffRole.id;

  for (let i = 0; i < staffData.length; i++) {
    const staff = staffData[i];

    let user: { id: string } | null = null;
    if (staff.hasAccount) {
      const passwordHash = await argon2.hash('staff123');
      user = await prisma.user.create({
        data: {
          email: staff.email,
          fullName: staff.name,
          passwordHash,
          phone: `98${(71000000 + i).toString()}`,
          isActive: true,
          roles: {
            create: {
              roleId: staffRoleId,
            },
          },
        },
      });
    }

    const staffMember = await prisma.staff.create({
      data: {
        userId: user?.id,
        email: staff.email,
        fullName: staff.name,
        firstName: staff.name.split(' ')[1] || staff.name.split(' ')[0],
        lastName: staff.name.split(' ')[staff.name.split(' ').length - 1],
        employeeId: `STF${(i + 1).toString().padStart(3, '0')}`,
        dob: randomDate(new Date('1980-01-01'), new Date('1995-01-01')),
        gender: i % 3 === 0 ? 'Male' : 'Female',
        bloodGroup: ['A+', 'B+', 'AB+', 'O+'][i % 4],
        phone: `98${(71000000 + i).toString()}`,
        emergencyContact: `98${(61000000 + i).toString()}`,
        maritalStatus: i % 3 === 0 ? 'Single' : 'Married',
        designation: staff.designation,
        department: staff.department,
        joiningDate: randomDate(new Date('2022-01-01'), new Date('2024-01-01')),
        basicSalary: 25000 + i * 2000,
        allowances: 5000 + i * 500,
        totalSalary: 30000 + i * 2500,
        permissions: staff.hasAccount ? ['VIEW_REPORTS', 'MANAGE_DATA'] : [],
        employmentStatus: 'active',
        experienceYears: i + 2,
      },
    });

    if (staff.hasAccount) {
      await prisma.staffProfile.create({
        data: {
          staffId: staffMember.id,
          bio: `${staff.designation} with expertise in ${staff.department}`,
          contactInfo: {
            email: staff.email,
            phone: staffMember.phone,
          },
        },
      });
    }
  }

  // =========================================================================
  // 6. CREATE PARENT USERS AND STUDENT USERS
  // =========================================================================
  console.log('👨‍👩‍👧‍👦 Creating parents and students...');

  const parentRoleId = parentRole.id;
  const studentRoleId = studentRole.id;

  const families = [
    {
      father: {
        name: 'Bikram Singh Thapa',
        email: 'bikram.thapa@gmail.com',
        phone: '9841001001',
        occupation: 'Engineer',
      },
      mother: {
        name: 'Sunita Thapa',
        email: 'sunita.thapa@gmail.com',
        phone: '9841001002',
        occupation: 'Teacher',
      },
      children: [
        {
          name: 'Arjun Thapa',
          email: 'arjun.thapa@student.edu',
          grade: 10,
          section: 'A',
          gender: 'Male',
          dob: '2009-03-15',
        },
        {
          name: 'Priya Thapa',
          email: 'priya.thapa@student.edu',
          grade: 7,
          section: 'B',
          gender: 'Female',
          dob: '2012-07-22',
        },
      ],
    },
    {
      father: {
        name: 'Rajesh Sharma',
        email: 'rajesh.sharma.parent@gmail.com',
        phone: '9841002001',
        occupation: 'Doctor',
      },
      mother: {
        name: 'Gita Sharma',
        email: 'gita.sharma@gmail.com',
        phone: '9841002002',
        occupation: 'Nurse',
      },
      children: [
        {
          name: 'Anish Sharma',
          email: 'anish.sharma@student.edu',
          grade: 9,
          section: 'A',
          gender: 'Male',
          dob: '2010-11-08',
        },
      ],
    },
    {
      father: {
        name: 'Krishna Gurung',
        email: 'krishna.gurung@gmail.com',
        phone: '9841003001',
        occupation: 'Business Owner',
      },
      mother: {
        name: 'Maya Gurung',
        email: 'maya.gurung@gmail.com',
        phone: '9841003002',
        occupation: 'Housewife',
      },
      children: [
        {
          name: 'Sagar Gurung',
          email: 'sagar.gurung@student.edu',
          grade: 8,
          section: 'A',
          gender: 'Male',
          dob: '2011-01-20',
        },
        {
          name: 'Shreya Gurung',
          email: 'shreya.gurung@student.edu',
          grade: 6,
          section: 'B',
          gender: 'Female',
          dob: '2013-09-14',
        },
      ],
    },
    {
      father: {
        name: 'Narayan Poudel',
        email: 'narayan.poudel@gmail.com',
        phone: '9841004001',
        occupation: 'Farmer',
      },
      children: [
        {
          name: 'Bibek Poudel',
          email: 'bibek.poudel@student.edu',
          grade: 5,
          section: 'B',
          gender: 'Male',
          dob: '2014-05-03',
        },
      ],
    },
    {
      mother: {
        name: 'Laxmi Tamang',
        email: 'laxmi.tamang@gmail.com',
        phone: '9841006001',
        occupation: 'Shop Owner',
      },
      children: [
        {
          name: 'Samjhana Tamang',
          email: 'samjhana.tamang@student.edu',
          grade: 4,
          section: 'A',
          gender: 'Female',
          dob: '2015-08-11',
        },
      ],
    },
  ];

  for (let familyIndex = 0; familyIndex < families.length; familyIndex++) {
    const family = families[familyIndex];
    const familyParentIds: string[] = [];

    // Create parents
    for (const parentType of ['father', 'mother']) {
      const parentData = family[parentType as keyof typeof family];
      if (
        parentData &&
        typeof parentData === 'object' &&
        'name' in parentData
      ) {
        const parent = parentData as {
          name: string;
          email: string;
          phone: string;
          occupation: string;
        };

        const passwordHash = await argon2.hash('parent123');
        const parentUser = await prisma.user.create({
          data: {
            email: parent.email,
            fullName: parent.name,
            passwordHash,
            phone: parent.phone,
            isActive: true,
            roles: {
              create: {
                roleId: parentRoleId,
              },
            },
          },
        });

        const parentRecord = await prisma.parent.create({
          data: {
            userId: parentUser.id,
            dateOfBirth: randomDate(
              new Date('1975-01-01'),
              new Date('1990-01-01'),
            ),
            gender: parentType === 'father' ? 'Male' : 'Female',
            occupation: parent.occupation,
            workPhone: parent.phone,
            emergencyContactName: 'Family Contact',
            emergencyContactPhone: `984100${familyIndex}999`,
            emergencyContactRelationship: 'Relative',
            street: `Family Street ${familyIndex + 1}`,
            city: 'Kathmandu',
            state: 'Bagmati',
            pinCode: `44600${familyIndex}`,
            country: 'Nepal',
          },
        });

        await prisma.parentProfile.create({
          data: {
            parentId: parentRecord.id,
            bio: `${parent.occupation} and parent of students at our school`,
          },
        });

        familyParentIds.push(parentRecord.id);
      }
    }

    // Create children (students)
    if ('children' in family && Array.isArray(family.children)) {
      for (const childData of family.children) {
        const child = childData as {
          name: string;
          email: string;
          grade: number;
          section: string;
          gender: string;
          dob: string;
        };

        // Find the appropriate class
        const studentClass = await prisma.class.findFirst({
          where: {
            grade: child.grade,
            section: child.section,
          },
        });

        if (!studentClass) continue;

        const passwordHash = await argon2.hash('student123');
        const studentUser = await prisma.user.create({
          data: {
            email: child.email,
            fullName: child.name,
            passwordHash,
            phone: `984100${familyIndex}${child.grade}${child.section.charCodeAt(0)}`,
            isActive: true,
            roles: {
              create: {
                roleId: studentRoleId,
              },
            },
          },
        });

        const student = await prisma.student.create({
          data: {
            userId: studentUser.id,
            classId: studentClass.id,
            rollNumber: `${child.grade}${child.section}${(familyIndex + 1).toString().padStart(2, '0')}`,
            admissionDate: randomDate(
              new Date('2023-04-01'),
              new Date('2024-04-01'),
            ),
            email: child.email,
            dob: new Date(child.dob),
            gender: child.gender,
            bloodGroup: ['A+', 'B+', 'O+', 'AB+'][familyIndex % 4],
            ethnicity: ['Brahmin', 'Chhetri', 'Gurung', 'Tamang', 'Magar'][
              familyIndex % 5
            ],
            academicStatus: 'active',
            feeStatus: familyIndex % 3 === 0 ? 'paid' : 'pending',
            address: `Family Street ${familyIndex + 1}, Kathmandu`,
            city: 'Kathmandu',
            state: 'Bagmati',
            pinCode: `44600${familyIndex}`,
            studentId: `STU${(familyIndex * 10 + family.children.indexOf(childData) + 1).toString().padStart(4, '0')}`,
            transportMode: ['School Bus', 'Private', 'Walking'][
              familyIndex % 3
            ],
            phone: studentUser.phone,
          },
        });

        // Create student profile
        await prisma.studentProfile.create({
          data: {
            studentId: student.id,
            emergencyContact: {
              name: 'Emergency Contact',
              phone: `984100${familyIndex}999`,
              relationship: 'Parent',
            },
            interests: ['Sports', 'Reading', 'Music', 'Art'][familyIndex % 4],
          },
        });

        // Link students to parents
        for (const parentId of familyParentIds) {
          await prisma.parentStudentLink.create({
            data: {
              parentId: parentId,
              studentId: student.id,
              relationship: 'parent',
              isPrimary: familyParentIds.indexOf(parentId) === 0,
            },
          });
        }

        // Create guardians for some students
        if (familyIndex % 3 === 0) {
          await prisma.guardian.create({
            data: {
              studentId: student.id,
              fullName: `Guardian of ${child.name}`,
              phone: `984100${familyIndex}888`,
              email: `guardian.${child.name.toLowerCase().replace(' ', '.')}@gmail.com`,
              relation: 'Uncle',
            },
          });
        }

        // Update class enrollment
        await prisma.class.update({
          where: { id: studentClass.id },
          data: {
            currentEnrollment: {
              increment: 1,
            },
          },
        });
      }
    }
  }

  // =========================================================================
  // 7. ASSIGN SUBJECTS TO CLASSES AND TEACHERS
  // =========================================================================
  console.log('📖 Assigning subjects to classes and teachers...');

  // Get some subjects and teachers for assignments
  const mathSubject = await prisma.subject.findFirst({
    where: { code: 'MATH' },
  });
  const englishSubject = await prisma.subject.findFirst({
    where: { code: 'ENG' },
  });

  // Assign subjects to classes
  for (const classId of classIds.slice(0, 10)) {
    if (mathSubject) {
      await prisma.classSubject.create({
        data: {
          classId,
          subjectId: mathSubject.id,
          teacherId: teacherIds[0],
        },
      });
    }

    if (englishSubject) {
      await prisma.classSubject.create({
        data: {
          classId,
          subjectId: englishSubject.id,
          teacherId: teacherIds[1],
        },
      });
    }
  }

  // Assign teachers to subjects
  if (mathSubject) {
    await prisma.teacherSubject.create({
      data: {
        teacherId: teacherIds[0],
        subjectId: mathSubject.id,
      },
    });
  }

  // =========================================================================
  // 8. CREATE CALENDAR EVENTS OF ALL TYPES
  // =========================================================================
  console.log('📅 Creating calendar events...');

  const currentYear = new Date().getFullYear();

  // Create holidays
  await prisma.calendarEntry.create({
    data: {
      name: 'New Year',
      type: 'HOLIDAY' as const,
      eventScope: 'SCHOOL_WIDE' as const,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-01-01`),
      holidayType: 'NATIONAL' as const,
    },
  });

  await prisma.calendarEntry.create({
    data: {
      name: 'Summer Vacation',
      type: 'HOLIDAY' as const,
      eventScope: 'SCHOOL_WIDE' as const,
      startDate: new Date(`${currentYear}-05-01`),
      endDate: new Date(`${currentYear}-05-31`),
      holidayType: 'SCHOOL' as const,
    },
  });

  // Create events
  await prisma.calendarEntry.create({
    data: {
      name: 'Annual Sports Day',
      type: 'EVENT' as const,
      eventScope: 'SCHOOL_WIDE' as const,
      startDate: new Date(`${currentYear}-02-01`),
      endDate: new Date(`${currentYear}-02-03`),
      venue: 'School Playground',
    },
  });

  // Create exams
  await prisma.calendarEntry.create({
    data: {
      name: 'First Term Examination',
      type: 'EXAM' as const,
      eventScope: 'SCHOOL_WIDE' as const,
      startDate: new Date(`${currentYear}-07-01`),
      endDate: new Date(`${currentYear}-07-15`),
      examType: 'FIRST_TERM' as const,
      examDetails: 'First terminal examination for all students',
    },
  });

  // =========================================================================
  // 9. CREATE NOTICES
  // =========================================================================
  console.log('📢 Creating notices...');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });

  const notices = [
    {
      title: 'School Reopening Notice',
      content:
        'School will reopen on Monday after the holiday break. All students are expected to attend.',
      priority: 'HIGH' as const,
      category: 'GENERAL' as const,
      recipientType: 'ALL' as const,
      publishDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED' as const,
      sendEmailNotification: true,
      createdById: adminUser!.id,
    },
    {
      title: 'Parent-Teacher Conference',
      content:
        'Monthly parent-teacher conference scheduled for next Friday. Please confirm your attendance.',
      priority: 'HIGH' as const,
      category: 'MEETING' as const,
      recipientType: 'PARENT' as const,
      publishDate: new Date(),
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED' as const,
      sendEmailNotification: false,
      createdById: adminUser!.id,
    },
  ];

  for (const notice of notices) {
    await prisma.notice.create({
      data: notice,
    });
  }

  console.log('✅ Comprehensive secondary seed completed successfully!');
  console.log('');
  console.log('📊 CREATED DATA SUMMARY:');
  console.log(`📚 ${subjectIds.length} Subjects`);
  console.log(`🏫 ${classroomIds.length} Classrooms`);
  console.log(`🎓 ${classIds.length} Classes`);
  console.log(`👨‍🏫 ${teacherIds.length} Teachers`);
  console.log(`👥 ${staffData.length} Staff Members`);
  console.log(`👨‍👩‍👧‍👦 ${families.length} Families`);
  console.log(`📅 4 Calendar Events`);
  console.log(`📢 ${notices.length} Notices`);
  console.log('');
  console.log('🔐 TEST USER CREDENTIALS:');
  console.log('');
  console.log('👨‍🏫 TEACHERS (password: teacher123):');
  console.log('  Email: rajesh.sharma@school.edu');
  console.log('  Email: sita.devi@school.edu');
  console.log('  Email: ramesh.thapa@school.edu');
  console.log('');
  console.log('👨‍👩‍👧‍👦 PARENTS (password: parent123):');
  console.log('  Email: bikram.thapa@gmail.com');
  console.log('  Email: sunita.thapa@gmail.com');
  console.log('  Email: rajesh.sharma.parent@gmail.com');
  console.log('');
  console.log('👨‍🎓 STUDENTS (password: student123):');
  console.log('  Email: arjun.thapa@student.edu');
  console.log('  Email: priya.thapa@student.edu');
  console.log('  Email: anish.sharma@student.edu');
  console.log('');
  console.log('👥 STAFF WITH ACCOUNTS (password: staff123):');
  console.log('  Email: gopal.adhikari@school.edu');
  console.log('  Email: mina.basnet@school.edu');
  console.log('  Email: suresh.paudel@school.edu');
}

void main()
  .catch(e => {
    console.error('❌ Error during comprehensive seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
