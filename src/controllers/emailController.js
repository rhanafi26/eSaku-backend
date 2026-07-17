const { PrismaClient } = require('@prisma/client');
const { sendReportEmail } = require('../services/emailService');

const prisma = new PrismaClient();

// Helper: Get date range (copy dari reportController)
const getDateRange = (period, date) => {
  const d = new Date(date);
  let start, end;

  switch (period) {
    case 'daily':
      start = new Date(d.setHours(0, 0, 0, 0));
      end = new Date(d.setHours(23, 59, 59, 999));
      break;
    case 'weekly':
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(d.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date();
      end = new Date();
  }

  return { start, end };
};

// Send monthly report email
exports.sendMonthlyReport = async (req, res) => {
  try {
    const userId = req.userId;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email tujuan harus diisi' });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Get report data (monthly)
    const period = 'monthly';
    const date = new Date().toISOString();
    const { start, end } = getDateRange(period, date);

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryMap = {};

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
        if (tx.expenseTypeId) {
          if (!categoryMap[tx.expenseTypeId]) {
            categoryMap[tx.expenseTypeId] = 0;
          }
          categoryMap[tx.expenseTypeId] += tx.amount;
        }
      }
    }

    // Get category names
    const categoryIds = Object.keys(categoryMap);
    const categoryNames = {};
    if (categoryIds.length > 0) {
      const categories = await prisma.expenseType.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });
      categories.forEach(c => { categoryNames[c.id] = c.name; });
    }

    const categoryBreakdown = Object.keys(categoryMap).map(id => ({
      id,
      name: categoryNames[id] || 'Unknown',
      total: categoryMap[id],
    }));

    const report = {
      period,
      dateRange: { start, end },
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length,
      },
      categories: categoryBreakdown,
      transactions,
    };

    // Send email
    await sendReportEmail(email, user, report);

    res.json({ message: 'Email laporan berhasil dikirim' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Gagal mengirim email' });
  }
};