const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Income Types
  const incomeTypes = [
    { name: 'utama' },
    { name: 'sampingan' },
    { name: 'kejutan' },
  ];

  for (const data of incomeTypes) {
    await prisma.incomeType.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
  }
  console.log('✅ Income types seeded');

  // Seed Expense Types
  const expenseTypes = [
    { name: 'makanan' },
    { name: 'transportasi' },
    { name: 'gayahidup' },
    { name: 'mendesak' },
  ];

  for (const data of expenseTypes) {
    await prisma.expenseType.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
  }
  console.log('✅ Expense types seeded');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });