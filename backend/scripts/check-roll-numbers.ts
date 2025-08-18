import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const existingStudents = await prisma.student.findMany({
      select: {
        rollNumber: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        rollNumber: 'asc',
      },
    });

    console.log('📋 Existing students with roll numbers:');
    existingStudents.forEach(student => {
      console.log(`   - Roll ${student.rollNumber}: ${student.user.fullName}`);
    });

    console.log(`\n📊 Total existing students: ${existingStudents.length}`);

    // Find the highest roll number
    const highestRoll =
      existingStudents.length > 0
        ? Math.max(...existingStudents.map(s => parseInt(s.rollNumber)))
        : 0;

    console.log(`🔢 Highest roll number: ${highestRoll}`);
    console.log(
      `📝 Next available roll numbers: ${highestRoll + 1} to ${highestRoll + 20}`,
    );
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
