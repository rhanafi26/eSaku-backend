const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create transaction (online) - pakai raw query
exports.createTransaction = async (req, res) => {
  try {
    const { type, incomeTypeId, expenseTypeId, amount, description, date, currency = 'IDR' } = req.body;
    const userId = req.userId;

    console.log('Received:', { type, incomeTypeId, expenseTypeId, amount, userId }); // Debug log

    // Validasi
    if (!type || !amount) {
      return res.status(400).json({ error: 'Type dan amount harus diisi' });
    }

    // Insert ke database langsung dengan raw query
    const result = await prisma.$queryRaw`
      INSERT INTO transactions (
        id, "userId", type, "incomeTypeId", "expenseTypeId", 
        amount, description, date, currency, "isSynced", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), ${userId}::uuid, ${type}, 
        ${type === 'income' ? incomeTypeId : null}::uuid, 
        ${type === 'expense' ? expenseTypeId : null}::uuid,
        ${parseFloat(amount)}, ${description || null}, 
        ${date ? new Date(date) : new Date()}, 
        ${currency}, true, NOW(), NOW()
      ) RETURNING id, "userId", type, "incomeTypeId", "expenseTypeId", 
        amount, description, date, currency, "isSynced", "createdAt", "updatedAt"
    `;

    res.status(201).json({
      message: 'Transaksi berhasil ditambahkan',
      transaction: result[0],
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server', 
      detail: error.message 
    });
  }
};

// Get all transactions - pakai raw query
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, type, limit = 50, page = 1 } = req.query;

    let where = `"userId" = '${userId}'::uuid`;
    
    if (startDate) {
      where += ` AND date >= '${new Date(startDate).toISOString()}'`;
    }
    if (endDate) {
      where += ` AND date <= '${new Date(endDate).toISOString()}'`;
    }
    if (type) {
      where += ` AND type = '${type}'`;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) FROM transactions WHERE ${where}
    `;
    const total = parseInt(countResult[0].count);

    // Get transactions
    const transactions = await prisma.$queryRaw`
      SELECT * FROM transactions 
      WHERE ${where}
      ORDER BY date DESC
      LIMIT ${parseInt(limit)} OFFSET ${skip}
    `;

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

// Sync offline transactions
exports.syncTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Data transaksi tidak valid' });
    }

    const results = [];
    for (const tx of transactions) {
      const { type, incomeTypeId, expenseTypeId, amount, description, date, currency = 'IDR' } = tx;

      if (!type || !amount) {
        results.push({ error: 'Invalid data', data: tx });
        continue;
      }

      try {
        const result = await prisma.$queryRaw`
          INSERT INTO transactions (
            id, "userId", type, "incomeTypeId", "expenseTypeId", 
            amount, description, date, currency, "isSynced", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), ${userId}::uuid, ${type}, 
            ${type === 'income' ? incomeTypeId : null}::uuid, 
            ${type === 'expense' ? expenseTypeId : null}::uuid,
            ${parseFloat(amount)}, ${description || null}, 
            ${date ? new Date(date) : new Date()}, 
            ${currency}, true, NOW(), NOW()
          ) RETURNING id
        `;
        results.push({ success: true, transaction: result[0] });
      } catch (err) {
        results.push({ error: err.message, data: tx });
      }
    }

    res.status(201).json({
      message: `${results.filter(r => r.success).length} transaksi berhasil disync`,
      results,
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await prisma.$queryRaw`
      DELETE FROM transactions 
      WHERE id = ${id}::uuid AND "userId" = ${userId}::uuid
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};