/* eslint-disable no-console */
import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Ensure core roles exist
  const roles = ['TEACHER', 'STUDENT', 'PARENT'];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role, description: `${role} role` },
    });
  }

  // Create classroom
  const room = await prisma.classroom.upsert({
    where: { roomNo: 'A-101' },
    update: {},
    create: {
      roomNo: 'A-101',
      name: 'Room A-101',
      capacity: 30,
      floor: 1,
      building: 'Main',
    },
  });

  // Create subjects
  const math = await prisma.subject.upsert({
    where: { id: 'seed-mth101' },
    update: {},
    create: {
      id: 'seed-mth101',
      code: 'MTH101',
      name: 'Mathematics',
      description: 'Intro Math',
      maxMarks: 100,
      passMarks: 40,
    },
  });

  const science = await prisma.subject.upsert({
    where: { id: 'seed-sci101' },
    update: {},
    create: {
      id: 'seed-sci101',
      code: 'SCI101',
      name: 'Science',
      description: 'General Science',
      maxMarks: 100,
      passMarks: 40,
    },
  });

  // Create teacher user + role
  const teacherPassword = await argon2.hash('teacher123');
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher.sample@sms.test' },
    update: { passwordHash: teacherPassword, fullName: 'Sample Teacher' },
    create: {
      email: 'teacher.sample@sms.test',
      fullName: 'Sample Teacher',
      passwordHash: teacherPassword,
      roles: { create: { role: { connect: { name: 'TEACHER' } } } },
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      joiningDate: new Date('2024-04-01'),
      designation: 'Class Teacher',
      dob: new Date('1990-01-15'),
      gender: 'Male',
      basicSalary: new Prisma.Decimal(50000),
      allowances: new Prisma.Decimal(0),
      totalSalary: new Prisma.Decimal(50000),
      qualification: 'B.Ed',
      experienceYears: 5,
      isClassTeacher: true,
    },
  });

  // Create class
  const classA = await prisma.class.create({
    data: {
      grade: 5,
      section: 'A',
      name: 'Grade 5 - A',
      capacity: 30,
      currentEnrollment: 0,
      roomId: room.id,
      classTeacherId: teacher.id,
      shift: 'MORNING',
      status: 'active',
    },
  });

  // Link teacher to class and subjects
  await prisma.teacherClass.create({
    data: {
      teacherId: teacher.id,
      classId: classA.id,
    },
  });

  await prisma.classSubject.createMany({
    data: [
      { classId: classA.id, subjectId: math.id, teacherId: teacher.id },
      { classId: classA.id, subjectId: science.id, teacherId: teacher.id },
    ],
    skipDuplicates: true,
  });

  // Create parent user + parent record
  const parentPassword = await argon2.hash('parent123');
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent.sample@sms.test' },
    update: { passwordHash: parentPassword, fullName: 'Sample Parent' },
    create: {
      email: 'parent.sample@sms.test',
      fullName: 'Sample Parent',
      passwordHash: parentPassword,
      roles: { create: { role: { connect: { name: 'PARENT' } } } },
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      gender: 'Female',
      occupation: 'Engineer',
      workPhone: '+977-9800000000',
    },
  });

  // Create two students linked to same parent
  const createStudent = async (data: {
    email: string;
    fullName: string;
    rollNumber: string;
    studentId: string;
  }) => {
    const password = await argon2.hash('student123');
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { passwordHash: password, fullName: data.fullName },
      create: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: password,
        roles: { create: { role: { connect: { name: 'STUDENT' } } } },
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        classId: classA.id,
        rollNumber: data.rollNumber,
        admissionDate: new Date('2024-04-15'),
        email: data.email,
        dob: new Date('2012-03-01'),
        gender: 'Male',
        bloodGroup: 'O+',
        fatherFirstName: 'Sample',
        motherFirstName: 'Sample',
        studentId: data.studentId,
        address: 'Sample Address',
        phone: '+977-9800000001',
      },
    });

    await prisma.parentStudentLink.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        relationship: 'Mother',
        isPrimary: true,
      },
    });

    return student;
  };

  const student1 = await createStudent({
    email: 'student.one@sms.test',
    fullName: 'Student One',
    rollNumber: '001',
    studentId: 'S-2024-0001',
  });

  const student2 = await createStudent({
    email: 'student.two@sms.test',
    fullName: 'Student Two',
    rollNumber: '002',
    studentId: 'S-2024-0002',
  });

  // Update class enrollment count
  await prisma.class.update({
    where: { id: classA.id },
    data: { currentEnrollment: 2 },
  });

  console.log('✅ Sample class seed completed');
  console.log('Class:', classA.name);
  console.log('Teacher login:', teacherUser.email, 'password: teacher123');
  console.log('Parent login:', parentUser.email, 'password: parent123');
  console.log(
    'Students:',
    student1.email,
    student2.email,
    'password: student123',
  );
}

void main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
