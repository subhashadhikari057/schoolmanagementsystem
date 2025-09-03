const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClasses() {
  try {
    console.log('🔍 Checking existing classes in database...\n');

    // Check if any classes exist
    const classCount = await prisma.class.count();
    console.log(`Total classes in database: ${classCount}`);

    if (classCount === 0) {
      console.log(
        '❌ No classes found! Students cannot be imported without classes.',
      );
      console.log(
        '💡 You need to create classes first. Here are some examples:',
      );
      console.log('   - Grade 10, Section A');
      console.log('   - Grade 9, Section B');
      console.log('   - Grade 11, Section A');
      return;
    }

    // List existing classes
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        grade: true,
        section: true,
        name: true,
        createdAt: true,
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });

    console.log('\n📚 Existing Classes:');
    classes.forEach(cls => {
      console.log(`  - Grade ${cls.grade}-${cls.section} (ID: ${cls.id})`);
    });

    // Check for specific classes that might be used in import
    const testClasses = [
      { grade: 10, section: 'A' },
      { grade: 9, section: 'B' },
      { grade: 11, section: 'A' },
    ];

    console.log('\n🔍 Checking for test classes:');
    for (const testClass of testClasses) {
      const exists = await prisma.class.findFirst({
        where: {
          grade: testClass.grade,
          section: testClass.section,
          deletedAt: null,
        },
      });

      if (exists) {
        console.log(
          `  ✅ Grade ${testClass.grade}-${testClass.section}: EXISTS (ID: ${exists.id})`,
        );
      } else {
        console.log(
          `  ❌ Grade ${testClass.grade}-${testClass.section}: MISSING`,
        );
      }
    }

    // Check roles
    console.log('\n🔐 Checking roles:');
    const roles = await prisma.role.findMany({
      select: { name: true, id: true },
    });

    roles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id})`);
    });

    // Check if we have admin users
    console.log('\n👤 Checking admin users:');
    const adminUsers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: { in: ['SUPER_ADMIN', 'ADMIN'] },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (adminUsers.length === 0) {
      console.log('  ❌ No admin users found!');
    } else {
      adminUsers.forEach(user => {
        const roleNames = user.roles.map(r => r.role.name).join(', ');
        console.log(
          `  ✅ ${user.fullName} (${user.email}) - Roles: ${roleNames}`,
        );
      });
    }
  } catch (error) {
    console.error('❌ Error checking classes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClasses();
