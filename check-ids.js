const { PrismaClient } = require("@prisma/client");

async function checkIds() {
  const prisma = new PrismaClient();

  try {
    const classes = await prisma.class.findMany();
    const sections = await prisma.section.findMany();

    console.log("=== CLASSES ===");
    classes.forEach((c) => console.log(`ID: ${c.id}, Name: ${c.name}`));

    console.log("\n=== SECTIONS ===");
    sections.forEach((s) =>
      console.log(`ID: ${s.id}, Name: ${s.name}, ClassID: ${s.classId}`),
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIds();
