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
import {
  DisabilityType,
  MotherTongue,
  PrismaClient,
  AttendanceStatus,
} from '@prisma/client';
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

  const currentYear = new Date().getFullYear();

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
    { name: 'History', code: 'HIST', maxMarks: 100, passMarks: 35 },
    { name: 'Geography', code: 'GEO', maxMarks: 100, passMarks: 35 },
    { name: 'Economics', code: 'ECO', maxMarks: 100, passMarks: 35 },
    { name: 'Accountancy', code: 'ACC', maxMarks: 100, passMarks: 35 },
    { name: 'Business Studies', code: 'BUS', maxMarks: 100, passMarks: 35 },
    { name: 'Health Education', code: 'HE', maxMarks: 100, passMarks: 35 },
    {
      name: 'Environmental Science',
      code: 'ENV',
      maxMarks: 100,
      passMarks: 35,
    },
    { name: 'Music', code: 'MUS', maxMarks: 50, passMarks: 20 },
    { name: 'Arts', code: 'ART', maxMarks: 50, passMarks: 20 },
    { name: 'Optional Math', code: 'OMATH', maxMarks: 100, passMarks: 35 },
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
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@school.edu',
      designation: 'Principal',
      department: 'Administration',
    },
    {
      name: 'Sita Devi',
      email: 'sita.devi@school.edu',
      designation: 'Vice Principal',
      department: 'Academic',
    },
    {
      name: 'Ramesh Thapa',
      email: 'ramesh.thapa@school.edu',
      designation: 'Senior Teacher',
      department: 'Mathematics',
    },
    {
      name: 'Geeta Acharya',
      email: 'geeta.acharya@school.edu',
      designation: 'Senior Teacher',
      department: 'English',
    },
    {
      name: 'Krishna Bahadur',
      email: 'krishna.bahadur@school.edu',
      designation: 'Head of Science',
      department: 'Science',
    },
    {
      name: 'Kamala Shrestha',
      email: 'kamala.shrestha@school.edu',
      designation: 'Teacher',
      department: 'Science',
    },
    {
      name: 'Bikash Koirala',
      email: 'bikash.koirala@school.edu',
      designation: 'Computer Teacher',
      department: 'Technology',
    },
    {
      name: 'Sunita Rana',
      email: 'sunita.rana@school.edu',
      designation: 'Teacher',
      department: 'Social Studies',
    },
    {
      name: 'Nabin Ghimire',
      email: 'nabin.ghimire@school.edu',
      designation: 'Teacher',
      department: 'Language',
    },
    {
      name: 'Asha Karki',
      email: 'asha.karki@school.edu',
      designation: 'Primary Teacher',
      department: 'Primary Education',
    },
    {
      name: 'Deepak Poudel',
      email: 'deepak.poudel@school.edu',
      designation: 'Mathematics Teacher',
      department: 'Mathematics',
    },
    {
      name: 'Priyanka Lama',
      email: 'priyanka.lama@school.edu',
      designation: 'Physics Teacher',
      department: 'Science',
    },
    {
      name: 'Prakash Bista',
      email: 'prakash.bista@school.edu',
      designation: 'Chemistry Teacher',
      department: 'Science',
    },
    {
      name: 'Manisha Shahi',
      email: 'manisha.shahi@school.edu',
      designation: 'Biology Teacher',
      department: 'Science',
    },
    {
      name: 'Arun KC',
      email: 'arun.kc@school.edu',
      designation: 'Economics Teacher',
      department: 'Economics',
    },
    {
      name: 'Binita Gautam',
      email: 'binita.gautam@school.edu',
      designation: 'Accountancy Teacher',
      department: 'Commerce',
    },
    {
      name: 'Santosh Magar',
      email: 'santosh.magar@school.edu',
      designation: 'Business Studies Teacher',
      department: 'Commerce',
    },
    {
      name: 'Reshma Khan',
      email: 'reshma.khan@school.edu',
      designation: 'Health Education Teacher',
      department: 'Health',
    },
    {
      name: 'Ashok Gurung',
      email: 'ashok.gurung@school.edu',
      designation: 'Geography Teacher',
      department: 'Social Studies',
    },
    {
      name: 'Nirmala Panta',
      email: 'nirmala.panta@school.edu',
      designation: 'History Teacher',
      department: 'Social Studies',
    },
    {
      name: 'Sujan Shrestha',
      email: 'sujan.shrestha@school.edu',
      designation: 'Music Teacher',
      department: 'Arts',
    },
    {
      name: 'Alisha Rai',
      email: 'alisha.rai@school.edu',
      designation: 'Arts Teacher',
      department: 'Arts',
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
        panNumber: `PAN${(1000 + i).toString().padStart(4, '0')}`,
        citizenshipNumber: `CIT${(2000 + i).toString().padStart(4, '0')}`,
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
        additionalData: {
          bankDetails: {
            bankName: 'Nepal Bank Limited',
            bankAccountNumber: `123456789${i.toString().padStart(2, '0')}`,
            bankBranch: 'Kathmandu Branch',
            panNumber: `PAN${(1000 + i).toString().padStart(4, '0')}`,
            citizenshipNumber: `CIT${(2000 + i).toString().padStart(4, '0')}`,
          },
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
  const staffIds: string[] = [];

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
        bankAccountNumber: `987654321${i.toString().padStart(2, '0')}`,
        bankName: 'Nepal Bank Limited',
        bankBranch: 'Kathmandu Branch',
        panNumber: `PAN${(300 + i).toString().padStart(4, '0')}`,
      },
    });
    staffIds.push(staffMember.id);

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

  const motherTongueOptions: MotherTongue[] = [
    MotherTongue.NEPALI,
    MotherTongue.TAMANG,
    MotherTongue.MAITHILI,
    MotherTongue.MAGAR_KHAM,
    MotherTongue.GURUNG,
  ];

  const disabilityTypeOptions: DisabilityType[] = [
    DisabilityType.NO_DISABILITY,
    DisabilityType.PHYSICAL,
    DisabilityType.LOW_VISION,
    DisabilityType.HARD_OF_HEARING,
    DisabilityType.NO_DISABILITY,
  ];

  const firstNamesMale = [
    'Arjun',
    'Bibek',
    'Prakash',
    'Rohan',
    'Sujan',
    'Niraj',
    'Aayush',
    'Sagar',
    'Ritesh',
    'Kiran',
  ];
  const firstNamesFemale = [
    'Priya',
    'Anita',
    'Samjhana',
    'Shristi',
    'Nisha',
    'Sita',
    'Aarati',
    'Maya',
    'Kabita',
    'Sneha',
  ];
  const lastNames = [
    'Thapa',
    'Gurung',
    'Shrestha',
    'Rai',
    'BK',
    'Tamang',
    'Magar',
    'Karki',
    'Poudel',
    'Basnet',
    'KC',
    'Yadav',
  ];
  const occupations = [
    'Engineer',
    'Teacher',
    'Doctor',
    'Nurse',
    'Farmer',
    'Shop Owner',
    'Business Owner',
    'Driver',
    'Accountant',
    'Civil Servant',
  ];

  let globalStudentCounter = 0;
  for (let classIndex = 0; classIndex < classIds.length; classIndex++) {
    const classId = classIds[classIndex];
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classRecord) continue;

    for (let i = 0; i < 20; i++) {
      const gender = i % 2 === 0 ? 'Male' : 'Female';
      const firstName =
        gender === 'Male'
          ? firstNamesMale[(classIndex + i) % firstNamesMale.length]
          : firstNamesFemale[(classIndex + i) % firstNamesFemale.length];
      const lastName = lastNames[(classIndex + i) % lastNames.length];
      const studentFullName = `${firstName} ${lastName}`;
      const sanitizedName = `${firstName}.${lastName}`.toLowerCase();
      const studentEmail = `${sanitizedName}.${classRecord.grade}${classRecord.section}${(
        i + 1
      )
        .toString()
        .padStart(2, '0')}@student.edu`;

      const fatherName = `${firstNamesMale[(i + 2) % firstNamesMale.length]} ${lastName}`;
      const motherName = `${firstNamesFemale[(i + 3) % firstNamesFemale.length]} ${lastName}`;
      const fatherEmail = `${sanitizedName}.father.${classRecord.grade}${classRecord.section}${(
        i + 1
      )
        .toString()
        .padStart(2, '0')}@parent.edu`;
      const motherEmail = `${sanitizedName}.mother.${classRecord.grade}${classRecord.section}${(
        i + 1
      )
        .toString()
        .padStart(2, '0')}@parent.edu`;

      const parentPhoneBase = `98${(60 + classIndex).toString().padStart(2, '0')}${(
        i + 1
      )
        .toString()
        .padStart(2, '0')}`;
      const fatherPhone = `${parentPhoneBase}1`;
      const motherPhone = `${parentPhoneBase}2`;

      // Create father
      const parentPasswordHash = await argon2.hash('parent123');
      const fatherUser = await prisma.user.create({
        data: {
          email: fatherEmail,
          fullName: fatherName,
          passwordHash: parentPasswordHash,
          phone: fatherPhone,
          isActive: true,
          roles: {
            create: { roleId: parentRoleId },
          },
        },
      });

      const fatherRecord = await prisma.parent.create({
        data: {
          userId: fatherUser.id,
          dateOfBirth: randomDate(
            new Date('1970-01-01'),
            new Date('1990-12-31'),
          ),
          gender: 'Male',
          occupation: occupations[(i + classIndex) % occupations.length],
          workPhone: fatherPhone,
          emergencyContactName: motherName,
          emergencyContactPhone: motherPhone,
          emergencyContactRelationship: 'Spouse',
          street: `Street ${classRecord.grade}-${classRecord.section}-${i + 1}`,
          city: 'Kathmandu',
          state: 'Bagmati',
          pinCode: `4460${classRecord.grade}`,
          country: 'Nepal',
        },
      });

      await prisma.parentProfile.create({
        data: {
          parentId: fatherRecord.id,
          bio: `Parent of student in Grade ${classRecord.grade}${classRecord.section}`,
        },
      });

      // Create mother
      const motherUser = await prisma.user.create({
        data: {
          email: motherEmail,
          fullName: motherName,
          passwordHash: parentPasswordHash,
          phone: motherPhone,
          isActive: true,
          roles: {
            create: { roleId: parentRoleId },
          },
        },
      });

      const motherRecord = await prisma.parent.create({
        data: {
          userId: motherUser.id,
          dateOfBirth: randomDate(
            new Date('1972-01-01'),
            new Date('1992-12-31'),
          ),
          gender: 'Female',
          occupation: occupations[(i + classIndex + 1) % occupations.length],
          workPhone: motherPhone,
          emergencyContactName: fatherName,
          emergencyContactPhone: fatherPhone,
          emergencyContactRelationship: 'Spouse',
          street: `Street ${classRecord.grade}-${classRecord.section}-${i + 1}`,
          city: 'Kathmandu',
          state: 'Bagmati',
          pinCode: `4460${classRecord.grade}`,
          country: 'Nepal',
        },
      });

      await prisma.parentProfile.create({
        data: {
          parentId: motherRecord.id,
          bio: `Parent of student in Grade ${classRecord.grade}${classRecord.section}`,
        },
      });

      const studentPasswordHash = await argon2.hash('student123');
      const studentUser = await prisma.user.create({
        data: {
          email: studentEmail,
          fullName: studentFullName,
          passwordHash: studentPasswordHash,
          phone: `98${(70 + classIndex).toString().padStart(2, '0')}${(i + 1)
            .toString()
            .padStart(2, '0')}9`,
          isActive: true,
          roles: { create: { roleId: studentRoleId } },
        },
      });

      const student = await prisma.student.create({
        data: {
          userId: studentUser.id,
          classId: classId,
          rollNumber: `${classRecord.grade}${classRecord.section}${(i + 1).toString().padStart(2, '0')}`,
          admissionDate: randomDate(
            new Date('2023-04-01'),
            new Date('2024-04-01'),
          ),
          email: studentEmail,
          dob: randomDate(new Date('2007-01-01'), new Date('2018-12-31')),
          gender,
          motherTongue:
            motherTongueOptions[(classIndex + i) % motherTongueOptions.length],
          disabilityType:
            disabilityTypeOptions[
              (classIndex + i) % disabilityTypeOptions.length
            ],
          bloodGroup: ['A+', 'B+', 'O+', 'AB+'][(classIndex + i) % 4],
          ethnicity: ['Brahmin', 'Chhetri', 'Gurung', 'Tamang', 'Magar'][
            (classIndex + i) % 5
          ],
          academicStatus: 'active',
          feeStatus: (classIndex + i) % 4 === 0 ? 'paid' : 'pending',
          address: `Street ${classRecord.grade}-${classRecord.section}-${i + 1}, Kathmandu`,
          street: `Street ${classRecord.grade}-${classRecord.section}-${i + 1}`,
          city: 'Kathmandu',
          state: 'Bagmati',
          pinCode: `4460${classRecord.grade}`,
          fatherPhone: fatherPhone,
          motherPhone: motherPhone,
          fatherEmail: fatherEmail,
          motherEmail: motherEmail,
          fatherOccupation: occupations[(i + classIndex) % occupations.length],
          motherOccupation:
            occupations[(i + classIndex + 1) % occupations.length],
          fatherFirstName: fatherName.split(' ')[0],
          fatherLastName: fatherName.split(' ')[1] ?? lastName,
          motherFirstName: motherName.split(' ')[0],
          motherLastName: motherName.split(' ')[1] ?? lastName,
          studentId: `STU${(globalStudentCounter + 1).toString().padStart(5, '0')}`,
          transportMode: ['School Bus', 'Private', 'Walking'][
            (classIndex + i) % 3
          ],
          phone: studentUser.phone,
        },
      });

      await prisma.studentProfile.create({
        data: {
          studentId: student.id,
          emergencyContact: {
            name: fatherName,
            phone: fatherPhone,
            relationship: 'Father',
          },
          interests: ['Sports', 'Reading', 'Music', 'Art'][
            (classIndex + i) % 4
          ],
        },
      });

      // Link students to parents
      for (const parentId of [fatherRecord.id, motherRecord.id]) {
        await prisma.parentStudentLink.create({
          data: {
            parentId,
            studentId: student.id,
            relationship: parentId === fatherRecord.id ? 'father' : 'mother',
            isPrimary: parentId === fatherRecord.id,
          },
        });
      }

      // Guardians for every 5th student
      if ((i + classIndex) % 5 === 0) {
        await prisma.guardian.create({
          data: {
            studentId: student.id,
            fullName: `Guardian of ${studentFullName}`,
            phone: `98${(40 + classIndex).toString().padStart(2, '0')}${(i + 1)
              .toString()
              .padStart(2, '0')}8`,
            email: `guardian.${sanitizedName}.${classRecord.grade}${classRecord.section}${(
              i + 1
            )
              .toString()
              .padStart(2, '0')}@gmail.com`,
            relation: 'Uncle',
          },
        });
      }

      await prisma.class.update({
        where: { id: classId },
        data: {
          currentEnrollment: { increment: 1 },
        },
      });

      globalStudentCounter++;
    }
  }

  // =========================================================================
  // 7. ASSIGN SUBJECTS TO CLASSES AND TEACHERS
  // =========================================================================
  console.log('📖 Assigning subjects to classes and teachers...');

  let classSubjectCount = 0;
  const allSubjects = await prisma.subject.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  });
  const classesWithMeta = await prisma.class.findMany({
    select: { id: true, grade: true, section: true },
    orderBy: [{ grade: 'asc' }, { section: 'asc' }],
  });

  const teacherSubjectPairs = new Set<string>();
  const teacherLoad = teacherIds.map(() => 0);

  const subjectTeacherMap: Record<string, number[]> = {
    MATH: [2, 10],
    OMATH: [2, 10],
    ENG: [3],
    NEP: [8],
    SCI: [4, 5],
    PHY: [11],
    CHEM: [12],
    BIO: [13],
    CS: [6],
    SOC: [7, 18],
    HIST: [19],
    GEO: [18],
    ECO: [14],
    ACC: [15],
    BUS: [16],
    HE: [17],
    ENV: [4, 5, 17],
    MUS: [20],
    ART: [21],
    PE: [7],
  };

  const pickTeacherForSubject = (subjectCode: string, idxHint: number) => {
    const preferred = subjectTeacherMap[subjectCode] || [];
    if (preferred.length) {
      const teacherIndex = preferred[idxHint % preferred.length];
      return teacherIds[teacherIndex % teacherIds.length];
    }
    // fallback: pick teacher with the lowest load to ensure everyone gets classes
    let bestIndex = 0;
    let bestLoad = teacherLoad[0];
    for (let i = 1; i < teacherLoad.length; i++) {
      if (teacherLoad[i] < bestLoad) {
        bestLoad = teacherLoad[i];
        bestIndex = i;
      }
    }
    return teacherIds[bestIndex];
  };

  for (let idx = 0; idx < classesWithMeta.length; idx++) {
    const classMeta = classesWithMeta[idx];
    const selectedSubjects = allSubjects; // attach every subject for richer demo

    for (let j = 0; j < selectedSubjects.length; j++) {
      const subject = selectedSubjects[j];
      const teacherId = pickTeacherForSubject(subject.code, idx + j);
      const teacherIndex = teacherIds.indexOf(teacherId);

      await prisma.classSubject.create({
        data: {
          classId: classMeta.id,
          subjectId: subject.id,
          teacherId,
        },
      });
      classSubjectCount++;
      if (teacherIndex >= 0) teacherLoad[teacherIndex] += 1;

      const pairKey = `${teacherId}-${subject.id}`;
      if (!teacherSubjectPairs.has(pairKey)) {
        await prisma.teacherSubject.create({
          data: {
            teacherId,
            subjectId: subject.id,
          },
        });
        teacherSubjectPairs.add(pairKey);
      }
    }
  }

  // =========================================================================
  // 7B. CREATE CLASS SCHEDULES WITH TIMESLOTS (CONFLICT-FREE TEACHER ASSIGNMENTS)
  // =========================================================================
  console.log('⏰ Building class schedules and timeslots...');

  // Classes run Sunday–Friday; Saturday is off
  const scheduleDays = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ];
  const periodTimes = [
    { start: '09:00', end: '09:45' },
    { start: '09:50', end: '10:35' },
    { start: '10:40', end: '11:25' },
    { start: '12:15', end: '13:00' },
    { start: '13:05', end: '13:50' },
    { start: '13:55', end: '14:40' },
  ];

  const academicYearLabel = `${currentYear}-${currentYear + 1}`;

  const classSubjects = await prisma.classSubject.findMany({
    include: { subject: true },
  });
  const classSubjectsByClass: Record<string, typeof classSubjects> = {};
  for (const cs of classSubjects) {
    if (!classSubjectsByClass[cs.classId])
      classSubjectsByClass[cs.classId] = [];
    classSubjectsByClass[cs.classId].push(cs);
  }

  const teacherSubjects = await prisma.teacherSubject.findMany({
    select: { teacherId: true, subjectId: true },
  });
  const teacherIdsBySubject: Record<string, string[]> = {};
  for (const ts of teacherSubjects) {
    if (!teacherIdsBySubject[ts.subjectId])
      teacherIdsBySubject[ts.subjectId] = [];
    teacherIdsBySubject[ts.subjectId].push(ts.teacherId);
  }

  const teacherAvailability = new Set<string>(); // key: `${teacherId}-${day}-${periodIndex}`
  let timeslotCount = 0;
  let scheduleCount = 0;
  let scheduleSlotCount = 0;

  for (let idx = 0; idx < classesWithMeta.length; idx++) {
    const classMeta = classesWithMeta[idx];
    const subjectsForClass = classSubjectsByClass[classMeta.id] || [];
    if (subjectsForClass.length === 0) continue;

    const classRoom = await prisma.class.findUnique({
      where: { id: classMeta.id },
      select: { roomId: true },
    });

    const schedule = await prisma.classSchedule.create({
      data: {
        classId: classMeta.id,
        name: `Regular Schedule ${classMeta.grade}${classMeta.section}`,
        academicYear: academicYearLabel,
        startDate: new Date(`${currentYear}-04-01`),
        endDate: new Date(`${currentYear + 1}-03-31`),
        effectiveFrom: new Date(`${currentYear}-04-01`),
        status: 'active',
      },
    });
    scheduleCount++;

    for (let dayIdx = 0; dayIdx < scheduleDays.length; dayIdx++) {
      const day = scheduleDays[dayIdx];
      for (let periodIdx = 0; periodIdx < periodTimes.length; periodIdx++) {
        const period = periodTimes[periodIdx];
        const timeslot = await prisma.classTimeslot.create({
          data: {
            classId: classMeta.id,
            day: day,
            startTime: period.start,
            endTime: period.end,
            type: 'REGULAR',
          },
        });
        timeslotCount++;

        const subject =
          subjectsForClass[
            (dayIdx * periodTimes.length + periodIdx) % subjectsForClass.length
          ];

        // Prefer the teacher assigned in classSubject; if unavailable, fall back to other teachers for the subject.
        const preferredTeachers: string[] = [];
        if (subject.teacherId) preferredTeachers.push(subject.teacherId);
        const subjectTeacherPool = teacherIdsBySubject[subject.subjectId] || [];
        for (const t of subjectTeacherPool) {
          if (!preferredTeachers.includes(t)) preferredTeachers.push(t);
        }
        // Final fallback rotation across all teachers
        preferredTeachers.push(...teacherIds);

        let selectedTeacherId = teacherIds[0];
        for (const tId of preferredTeachers) {
          const availabilityKey = `${tId}-${day}-${periodIdx}`;
          if (!teacherAvailability.has(availabilityKey)) {
            selectedTeacherId = tId;
            teacherAvailability.add(availabilityKey);
            break;
          }
        }

        await prisma.scheduleSlot.create({
          data: {
            scheduleId: schedule.id,
            timeslotId: timeslot.id,
            day,
            subjectId: subject.subjectId,
            teacherId: selectedTeacherId,
            roomId: classRoom?.roomId ?? classroomIds[0],
            type: 'REGULAR',
          },
        });
        scheduleSlotCount++;
      }
    }
  }

  // =========================================================================
  // 7C. CREATE ASSIGNMENTS WITH SUBMISSIONS
  // =========================================================================
  console.log('📝 Creating assignments and submissions...');

  const studentsForAssignments = await prisma.student.findMany({
    select: { id: true, classId: true },
  });
  const studentsByClassForAssignments: Record<string, string[]> = {};
  for (const s of studentsForAssignments) {
    if (!studentsByClassForAssignments[s.classId])
      studentsByClassForAssignments[s.classId] = [];
    studentsByClassForAssignments[s.classId].push(s.id);
  }

  const assignmentMonths = [
    { year: 2025, month: 10, label: 'November' }, // 0-based month
    { year: 2025, month: 11, label: 'December' },
    { year: 2026, month: 0, label: 'January' },
  ];

  let assignmentCount = 0;
  let submissionCount = 0;

  for (const classMeta of classesWithMeta) {
    const subjectsForClass = classSubjectsByClass[classMeta.id] || [];
    const studentsInClass = studentsByClassForAssignments[classMeta.id] || [];
    if (!subjectsForClass.length || !studentsInClass.length) continue;

    const selectedSubjects = subjectsForClass.slice(0, 4);
    for (const subject of selectedSubjects) {
      const teacherId = subject.teacherId || teacherIds[0];

      for (const monthInfo of assignmentMonths) {
        const dueDay = 5 + Math.floor(Math.random() * 20); // between 5-24
        const dueDate = new Date(monthInfo.year, monthInfo.month, dueDay);

        const assignment = await prisma.assignment.create({
          data: {
            title: `${subject.subject.name} Assignment - ${monthInfo.label}`,
            description: `Complete the ${subject.subject.name} tasks for ${monthInfo.label}.`,
            classId: classMeta.id,
            subjectId: subject.subjectId,
            teacherId,
            dueDate,
            additionalMetadata: {
              difficulty: ['easy', 'medium', 'hard'][assignmentCount % 3],
            },
          },
        });
        assignmentCount++;

        const submissionsStudents = studentsInClass.slice(0, 12);
        for (let idx = 0; idx < submissionsStudents.length; idx++) {
          const studentId = submissionsStudents[idx];
          const isCompleted = idx % 4 !== 0; // some missed
          await prisma.submission.create({
            data: {
              assignmentId: assignment.id,
              studentId,
              isCompleted,
              submittedAt: isCompleted
                ? new Date(
                    dueDate.getFullYear(),
                    dueDate.getMonth(),
                    Math.max(1, dueDate.getDate() - 2),
                  )
                : null,
              feedback: isCompleted ? 'Good effort' : null,
              studentNotes: isCompleted ? 'Submitted on time' : null,
            },
          });
          submissionCount++;
        }
      }
    }
  }

  // =========================================================================
  // 7C. CREATE ATTENDANCE RECORDS (30-DAY WINDOW)
  // =========================================================================
  console.log('📝 Creating attendance records for 30-day window...');

  let attendanceMarker = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });
  if (!attendanceMarker) {
    const passwordHash = await argon2.hash('admin123');
    attendanceMarker = await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        fullName: 'System Admin',
        passwordHash,
        phone: '9800009999',
        isActive: true,
        roles: {
          create: {
            roleId: staffRole.id,
          },
        },
      },
    });
  }

  const studentsByClassRaw = await prisma.student.findMany({
    select: { id: true, classId: true },
  });
  const studentsByClass: Record<string, string[]> = {};
  for (const s of studentsByClassRaw) {
    if (!studentsByClass[s.classId]) studentsByClass[s.classId] = [];
    studentsByClass[s.classId].push(s.id);
  }

  const attendanceStart = new Date(2025, 11, 1); // December 1, 2025
  const rawAttendanceDays = Array.from(
    { length: 29 },
    (_, i) =>
      new Date(
        attendanceStart.getFullYear(),
        attendanceStart.getMonth(),
        i + 1,
      ),
  );
  const attendanceDays = rawAttendanceDays.filter(
    d => d.getDay() !== 6, // skip Saturdays
  );

  const statusCycle: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.ABSENT,
    AttendanceStatus.EXCUSED,
  ];
  const pickStatus = (seed: number) => statusCycle[seed % statusCycle.length];

  let studentAttendanceSessionCount = 0;
  let studentAttendanceRecordCount = 0;
  let teacherAttendanceSessionCount = 0;
  let teacherAttendanceRecordCount = 0;
  let staffAttendanceSessionCount = 0;
  let staffAttendanceRecordCount = 0;

  // Students
  for (let dayIdx = 0; dayIdx < attendanceDays.length; dayIdx++) {
    const day = attendanceDays[dayIdx];
    for (const classMeta of classesWithMeta) {
      const students = studentsByClass[classMeta.id] || [];
      if (students.length === 0) continue;

      const session = await prisma.attendanceSession.create({
        data: {
          classId: classMeta.id,
          date: day,
          sessionType: 'daily',
          markedBy: attendanceMarker.id,
          isCompleted: true,
          notes: 'Auto-seeded attendance',
        },
      });
      studentAttendanceSessionCount++;

      await prisma.attendanceRecord.createMany({
        data: students.map((studentId, idx) => {
          const status = pickStatus(dayIdx + idx);
          return {
            sessionId: session.id,
            studentId,
            status,
            markedAt: day,
            remarks:
              status === AttendanceStatus.ABSENT ? 'Absent (seed)' : undefined,
          };
        }),
      });
      studentAttendanceRecordCount += students.length;
    }
  }

  // Teachers
  for (let dayIdx = 0; dayIdx < attendanceDays.length; dayIdx++) {
    const day = attendanceDays[dayIdx];
    const session = await prisma.teacherAttendanceSession.create({
      data: {
        date: day,
        sessionType: 'daily',
        markedBy: attendanceMarker.id,
        isCompleted: true,
        notes: 'Auto-seeded attendance',
      },
    });
    teacherAttendanceSessionCount++;

    await prisma.teacherAttendanceRecord.createMany({
      data: teacherIds.map((teacherId, idx) => {
        const status = pickStatus(dayIdx + idx + 3); // slight offset
        return {
          sessionId: session.id,
          teacherId,
          status,
          markedAt: day,
          remarks:
            status === AttendanceStatus.ABSENT ? 'Absent (seed)' : undefined,
        };
      }),
    });
    teacherAttendanceRecordCount += teacherIds.length;
  }

  // Staff
  for (let dayIdx = 0; dayIdx < attendanceDays.length; dayIdx++) {
    const day = attendanceDays[dayIdx];
    const session = await prisma.staffAttendanceSession.create({
      data: {
        date: day,
        sessionType: 'daily',
        markedBy: attendanceMarker.id,
        isCompleted: true,
        notes: 'Auto-seeded attendance',
      },
    });
    staffAttendanceSessionCount++;

    await prisma.staffAttendanceRecord.createMany({
      data: staffIds.map((staffId, idx) => {
        const status = pickStatus(dayIdx + idx + 5); // offset
        return {
          sessionId: session.id,
          staffId,
          status,
          markedAt: day,
          remarks:
            status === AttendanceStatus.ABSENT ? 'Absent (seed)' : undefined,
        };
      }),
    });
    staffAttendanceRecordCount += staffIds.length;
  }

  // =========================================================================
  // 8. CREATE CALENDAR EVENTS OF ALL TYPES
  // =========================================================================
  console.log('📅 Creating calendar events...');

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
  const examCalendarEntry = await prisma.calendarEntry.create({
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

  // Exam schedules and slots per class
  console.log('🧪 Creating exam schedules and slots...');
  let examScheduleCount = 0;
  let examSlotCount = 0;

  const examDateslots: string[] = [];
  const baseExamDate = new Date(examCalendarEntry.startDate);
  const examDays = [0, 1, 3, 5, 7]; // spread across the window
  for (let i = 0; i < examDays.length; i++) {
    const d = new Date(baseExamDate);
    d.setDate(d.getDate() + examDays[i]);
    const dateslot = await prisma.examDateslot.create({
      data: {
        calendarEntryId: examCalendarEntry.id,
        examDate: d,
        startTime: '09:00',
        endTime: '11:00',
        label: `Exam Day ${i + 1}`,
        type: 'EXAM',
      },
    });
    examDateslots.push(dateslot.id);
  }

  const classRooms = await prisma.class.findMany({
    select: { id: true, roomId: true, grade: true, section: true },
  });
  const roomByClass: Record<string, string | null> = {};
  classRooms.forEach(c => {
    roomByClass[c.id] = c.roomId;
  });

  for (const classMeta of classesWithMeta) {
    const schedule = await prisma.examSchedule.create({
      data: {
        classId: classMeta.id,
        calendarEntryId: examCalendarEntry.id,
        name: `Grade ${classMeta.grade} Term Exam`,
        academicYear: `${currentYear}-${currentYear + 1}`,
        status: 'scheduled',
      },
    });
    examScheduleCount++;

    const subjectsForClass = classSubjectsByClass[classMeta.id] || [];
    const subjects = subjectsForClass.slice(
      0,
      Math.min(5, subjectsForClass.length),
    );
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const dateslotId = examDateslots[i % examDateslots.length];
      await prisma.examSlot.create({
        data: {
          examScheduleId: schedule.id,
          dateslotId,
          subjectId: subject.subjectId,
          roomId: roomByClass[classMeta.id],
          duration: 90,
          instructions: `Answer all questions for ${subject.subject.name}`,
        },
      });
      examSlotCount++;
    }
  }

  // Create a past exam (previous year) with marks for every student/subject
  console.log('🧪 Creating past exam schedules, slots, and results...');
  let examResultCount = 0;
  const previousYear = currentYear - 1;
  const pastExamEntry = await prisma.calendarEntry.create({
    data: {
      name: 'Past Final Examination',
      type: 'EXAM' as const,
      eventScope: 'SCHOOL_WIDE' as const,
      startDate: new Date(`${previousYear}-11-01`),
      endDate: new Date(`${previousYear}-11-15`),
      examType: 'FINAL' as const,
      examDetails: 'Past final examination seeded for analytics',
    },
  });

  const pastExamDateslots: string[] = [];
  const pastBase = new Date(pastExamEntry.startDate);
  const pastDays = [0, 2, 4, 6, 8];
  for (let i = 0; i < pastDays.length; i++) {
    const d = new Date(pastBase);
    d.setDate(d.getDate() + pastDays[i]);
    const slot = await prisma.examDateslot.create({
      data: {
        calendarEntryId: pastExamEntry.id,
        examDate: d,
        startTime: '09:00',
        endTime: '11:00',
        label: `Past Exam Day ${i + 1}`,
        type: 'EXAM',
      },
    });
    pastExamDateslots.push(slot.id);
  }

  const studentsByClassForExams = await prisma.student.findMany({
    select: { id: true, classId: true },
  });
  const studentsByClassMap: Record<string, string[]> = {};
  for (const s of studentsByClassForExams) {
    if (!studentsByClassMap[s.classId]) studentsByClassMap[s.classId] = [];
    studentsByClassMap[s.classId].push(s.id);
  }

  for (const classMeta of classesWithMeta) {
    const schedule = await prisma.examSchedule.create({
      data: {
        classId: classMeta.id,
        calendarEntryId: pastExamEntry.id,
        name: `Grade ${classMeta.grade} Final Exam (${previousYear})`,
        academicYear: `${previousYear}-${previousYear + 1}`,
        status: 'completed',
      },
    });
    examScheduleCount++;

    const subjectsForClass = classSubjectsByClass[classMeta.id] || [];
    const selectedSubjects = subjectsForClass.slice(
      0,
      Math.min(5, subjectsForClass.length),
    );
    const studentsInClass = studentsByClassMap[classMeta.id] || [];

    for (let i = 0; i < selectedSubjects.length; i++) {
      const subject = selectedSubjects[i];
      const dateslotId = pastExamDateslots[i % pastExamDateslots.length];
      const examSlot = await prisma.examSlot.create({
        data: {
          examScheduleId: schedule.id,
          dateslotId,
          subjectId: subject.subjectId,
          roomId: roomByClass[classMeta.id],
          duration: 90,
          instructions: `Final exam for ${subject.subject.name}`,
        },
      });
      examSlotCount++;

      for (const studentId of studentsInClass) {
        const marks = 45 + Math.floor(Math.random() * 46); // 45-90
        await prisma.examResult.create({
          data: {
            examSlotId: examSlot.id,
            studentId,
            marksObtained: marks,
            isPassed: marks >= subject.subject.passMarks,
            status: 'PUBLISHED',
            gradedAt: new Date(`${previousYear}-11-20`),
          },
        });
        examResultCount++;
      }
    }
  }

  // =========================================================================
  // 9. CREATE NOTICES
  // =========================================================================
  console.log('📢 Creating notices...');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });

  let noticeCreatorId = adminUser?.id;
  if (!noticeCreatorId) {
    const passwordHash = await argon2.hash('admin123');
    const fallbackAdmin = await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        fullName: 'System Admin',
        passwordHash,
        phone: '9800009999',
        isActive: true,
        roles: {
          create: {
            roleId: staffRole.id,
          },
        },
      },
    });

    noticeCreatorId = fallbackAdmin.id;
  }

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
      createdById: noticeCreatorId,
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
      createdById: noticeCreatorId,
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
  console.log(`👨‍🎓 ${globalStudentCounter} Students`);
  console.log(`👨‍👩‍👧 ${globalStudentCounter * 2} Parents`);
  console.log(`📖 ${classSubjectCount} Class-Subject assignments`);
  console.log(`👩‍🏫 ${teacherSubjectPairs.size} Teacher-Subject assignments`);
  console.log(`🗓️ ${scheduleCount} Class Schedules`);
  console.log(`⏱️ ${timeslotCount} Timeslots`);
  console.log(`📅 ${scheduleSlotCount} Schedule Slots`);
  console.log(
    `🧪 ${examScheduleCount} Exam Schedules / ${examSlotCount} Exam Slots`,
  );
  console.log(
    `📝 ${assignmentCount} Assignments with ${submissionCount} Submissions`,
  );
  console.log(`🧾 ${examResultCount} Exam Results`);
  console.log(
    `🧑‍🎓 Attendance: ${studentAttendanceSessionCount} student sessions / ${studentAttendanceRecordCount} records`,
  );
  console.log(
    `🧑‍🏫 Attendance: ${teacherAttendanceSessionCount} teacher sessions / ${teacherAttendanceRecordCount} records`,
  );
  console.log(
    `🧑‍💼 Attendance: ${staffAttendanceSessionCount} staff sessions / ${staffAttendanceRecordCount} records`,
  );
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
