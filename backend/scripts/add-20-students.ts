import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const CLASS_ID = '99625ff8-08eb-4c5e-8f1e-ddc022a65309';

const studentsData = [
  {
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav.sharma.002@student.com',
    phone: '9876543202',
    rollNumber: '002',
    address: '123 Main Street',
    street: 'Gandhi Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
    fatherFirstName: 'Rajesh',
    fatherLastName: 'Sharma',
    fatherEmail: 'rajesh.sharma.002@email.com',
    fatherPhone: '9876543207',
    motherFirstName: 'Priya',
    motherLastName: 'Sharma',
    motherEmail: 'priya.sharma.002@email.com',
    motherPhone: '9876543208',
    guardianFirstName: 'Amit',
    guardianLastName: 'Sharma',
    guardianEmail: 'amit.sharma.002@email.com',
    guardianPhone: '9876543209',
    guardianRelation: 'Uncle',
  },
  {
    firstName: 'Zara',
    lastName: 'Patel',
    email: 'zara.patel.003@student.com',
    phone: '9876543203',
    rollNumber: '003',
    address: '456 Park Avenue',
    street: 'Nehru Street',
    city: 'Delhi',
    state: 'Delhi',
    pinCode: '110001',
    fatherFirstName: 'Vikram',
    fatherLastName: 'Patel',
    fatherEmail: 'vikram.patel.003@email.com',
    fatherPhone: '9876543210',
    motherFirstName: 'Anjali',
    motherLastName: 'Patel',
    motherEmail: 'anjali.patel.003@email.com',
    motherPhone: '9876543211',
    guardianFirstName: 'Rahul',
    guardianLastName: 'Patel',
    guardianEmail: 'rahul.patel.003@email.com',
    guardianPhone: '9876543212',
    guardianRelation: 'Brother',
  },
  {
    firstName: 'Arjun',
    lastName: 'Singh',
    email: 'arjun.singh.004@student.com',
    phone: '9876543204',
    rollNumber: '004',
    address: '789 Lake View',
    street: 'Tagore Lane',
    city: 'Bangalore',
    state: 'Karnataka',
    pinCode: '560001',
    fatherFirstName: 'Harinder',
    fatherLastName: 'Singh',
    fatherEmail: 'harinder.singh.004@email.com',
    fatherPhone: '9876543213',
    motherFirstName: 'Gurpreet',
    motherLastName: 'Singh',
    motherEmail: 'gurpreet.singh.004@email.com',
    motherPhone: '9876543214',
    guardianFirstName: 'Manpreet',
    guardianLastName: 'Singh',
    guardianEmail: 'manpreet.singh.004@email.com',
    guardianPhone: '9876543215',
    guardianRelation: 'Cousin',
  },
  {
    firstName: 'Ishaan',
    lastName: 'Kumar',
    email: 'ishaan.kumar.005@student.com',
    phone: '9876543205',
    rollNumber: '005',
    address: '321 Garden Road',
    street: 'Subhash Marg',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600001',
    fatherFirstName: 'Suresh',
    fatherLastName: 'Kumar',
    fatherEmail: 'suresh.kumar.005@email.com',
    fatherPhone: '9876543216',
    motherFirstName: 'Lakshmi',
    motherLastName: 'Kumar',
    motherEmail: 'lakshmi.kumar.005@email.com',
    motherPhone: '9876543217',
    guardianFirstName: 'Ramesh',
    guardianLastName: 'Kumar',
    guardianEmail: 'ramesh.kumar.005@email.com',
    guardianPhone: '9876543218',
    guardianRelation: 'Uncle',
  },
  {
    firstName: 'Aisha',
    lastName: 'Khan',
    email: 'aisha.khan.006@student.com',
    phone: '9876543206',
    rollNumber: '006',
    address: '654 Hill Street',
    street: 'Azad Road',
    city: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500001',
    fatherFirstName: 'Imran',
    fatherLastName: 'Khan',
    fatherEmail: 'imran.khan.006@email.com',
    fatherPhone: '9876543219',
    motherFirstName: 'Fatima',
    motherLastName: 'Khan',
    motherEmail: 'fatima.khan.006@email.com',
    motherPhone: '9876543220',
    guardianFirstName: 'Ahmed',
    guardianLastName: 'Khan',
    guardianEmail: 'ahmed.khan.006@email.com',
    guardianPhone: '9876543221',
    guardianRelation: 'Brother',
  },
];

async function createStudent(studentData: any) {
  try {
    // Create user account for student
    const hashedPassword = await hash('student123', 10);
    const user = await prisma.user.create({
      data: {
        fullName: `${studentData.firstName} ${studentData.lastName}`,
        email: studentData.email,
        phone: studentData.phone,
        passwordHash: hashedPassword,
      },
    });

    // Assign STUDENT role
    const studentRole = await prisma.role.findUnique({
      where: { name: 'STUDENT' },
    });

    if (studentRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: studentRole.id,
        },
      });
    }

    // Create student record
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        classId: CLASS_ID,
        rollNumber: studentData.rollNumber,
        admissionDate: new Date(),
        email: studentData.email,
        dob: new Date('2010-01-01'), // Default DOB
        gender: 'male',
        address: studentData.address,
        street: studentData.street,
        city: studentData.city,
        state: studentData.state,
        pinCode: studentData.pinCode,
        fatherFirstName: studentData.fatherFirstName,
        fatherLastName: studentData.fatherLastName,
        fatherEmail: studentData.fatherEmail,
        fatherPhone: studentData.fatherPhone,
        motherFirstName: studentData.motherFirstName,
        motherLastName: studentData.motherLastName,
        motherEmail: studentData.motherEmail,
        motherPhone: studentData.motherPhone,
      },
    });

    // Create father user and parent
    const fatherHashedPassword = await hash('parent123', 10);
    const fatherUser = await prisma.user.create({
      data: {
        fullName: `${studentData.fatherFirstName} ${studentData.fatherLastName}`,
        email: studentData.fatherEmail,
        phone: studentData.fatherPhone,
        passwordHash: fatherHashedPassword,
      },
    });

    // Assign PARENT role to father
    const parentRole = await prisma.role.findUnique({
      where: { name: 'PARENT' },
    });

    if (parentRole) {
      await prisma.userRole.create({
        data: {
          userId: fatherUser.id,
          roleId: parentRole.id,
        },
      });
    }

    const father = await prisma.parent.create({
      data: {
        userId: fatherUser.id,
      },
    });

    // Create mother user and parent
    const motherHashedPassword = await hash('parent123', 10);
    const motherUser = await prisma.user.create({
      data: {
        fullName: `${studentData.motherFirstName} ${studentData.motherLastName}`,
        email: studentData.motherEmail,
        phone: studentData.motherPhone,
        passwordHash: motherHashedPassword,
      },
    });

    // Assign PARENT role to mother
    if (parentRole) {
      await prisma.userRole.create({
        data: {
          userId: motherUser.id,
          roleId: parentRole.id,
        },
      });
    }

    const mother = await prisma.parent.create({
      data: {
        userId: motherUser.id,
      },
    });

    // Link parents to student
    // First 2 students (roll 002-003) have both parents as primary, next 3 (roll 004-006) have only father as primary
    const studentIndex = parseInt(studentData.rollNumber) - 2; // Convert roll number to 0-based index (starting from 002)

    await prisma.parentStudentLink.create({
      data: {
        parentId: father.id,
        studentId: student.id,
        relationship: 'father',
        isPrimary: true,
      },
    });

    await prisma.parentStudentLink.create({
      data: {
        parentId: mother.id,
        studentId: student.id,
        relationship: 'mother',
        isPrimary: studentIndex < 2, // First 2 students (roll 002-003) have mother as primary too
      },
    });

    // Create guardian
    const guardian = await prisma.guardian.create({
      data: {
        studentId: student.id,
        fullName: `${studentData.guardianFirstName} ${studentData.guardianLastName}`,
        phone: studentData.guardianPhone,
        email: studentData.guardianEmail,
        relation: studentData.guardianRelation,
      },
    });

    console.log(
      `✅ Created student: ${studentData.firstName} ${studentData.lastName} (Roll: ${studentData.rollNumber})`,
    );
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Student ID: ${student.id}`);
    console.log(
      `   - Father: ${studentData.fatherFirstName} ${studentData.fatherLastName} (Primary: true)`,
    );
    console.log(
      `   - Mother: ${studentData.motherFirstName} ${studentData.motherLastName} (Primary: ${studentIndex < 2})`,
    );
    console.log(
      `   - Guardian: ${studentData.guardianFirstName} ${studentData.guardianLastName}`,
    );
    console.log('');

    return { student, user, father, mother, guardian };
  } catch (error) {
    console.error(
      `❌ Error creating student ${studentData.firstName} ${studentData.lastName}:`,
      error,
    );
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting to create 5 students...\n');
  console.log(`📚 Class ID: ${CLASS_ID}\n`);

  try {
    // Verify class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: CLASS_ID },
    });

    if (!classRecord) {
      throw new Error(`Class with ID ${CLASS_ID} not found!`);
    }

    console.log(
      `✅ Found class: ${classRecord.grade}${classRecord.section} (${classRecord.shift} shift)\n`,
    );

    // Create students
    for (const studentData of studentsData) {
      await createStudent(studentData);
    }

    console.log('🎉 Successfully created all 5 students!');
    console.log('\n📋 Summary:');
    console.log('- 5 students created');
    console.log('- 10 parent accounts created (5 fathers + 5 mothers)');
    console.log('- 5 guardian records created');
    console.log('- All students linked to parents and guardians');
    console.log('- First 2 students (Roll 002-003): Both parents are primary');
    console.log('- Next 3 students (Roll 004-006): Only father is primary');
    console.log('\n🔑 Default Passwords:');
    console.log('- Students: student123');
    console.log('- Parents: parent123');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
