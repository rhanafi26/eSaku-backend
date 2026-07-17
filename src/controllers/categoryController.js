const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all income types
exports.getIncomeTypes = async (req, res) => {
  try {
    const types = await prisma.incomeType.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data pemasukan' });
  }
};

// Get all expense types
exports.getExpenseTypes = async (req, res) => {
  try {
    const types = await prisma.expenseType.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data pengeluaran' });
  }
};