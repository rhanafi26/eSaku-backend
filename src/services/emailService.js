const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Konfigurasi email (Gmail + App Password)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password Gmail (16 digit)
  },
});

// Generate PDF dari laporan
const generatePDF = (report, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(24).text('📊 eSaku - Laporan Keuangan', { align: 'center' });
      doc.moveDown();

      // User info
      doc.fontSize(12).text(`Nama: ${user.username}`);
      doc.text(`Email: ${user.email}`);
      doc.text(`Periode: ${report.period}`);
      doc.text(`Tanggal: ${new Date(report.dateRange.start).toLocaleDateString()} - ${new Date(report.dateRange.end).toLocaleDateString()}`);
      doc.moveDown();

      // Summary
      doc.fontSize(16).text('📋 Ringkasan', { underline: true });
      doc.fontSize(12)
        .text(`✅ Total Pemasukan: Rp ${report.summary.totalIncome.toLocaleString()}`)
        .text(`❌ Total Pengeluaran: Rp ${report.summary.totalExpense.toLocaleString()}`)
        .text(`💰 Balance: Rp ${report.summary.balance.toLocaleString()}`)
        .text(`📦 Jumlah Transaksi: ${report.summary.transactionCount}`);
      doc.moveDown();

      // Categories
      if (report.categories && report.categories.length > 0) {
        doc.fontSize(14).text('📂 Kategori Pengeluaran', { underline: true });
        report.categories.forEach(cat => {
          doc.fontSize(12).text(`- ${cat.name}: Rp ${cat.total.toLocaleString()}`);
        });
        doc.moveDown();
      }

      // Transactions
      if (report.transactions && report.transactions.length > 0) {
        doc.fontSize(14).text('📜 Transaksi', { underline: true });
        report.transactions.forEach(tx => {
          const typeLabel = tx.type === 'income' ? '✅ Pemasukan' : '❌ Pengeluaran';
          const dateStr = new Date(tx.date).toLocaleDateString();
          doc.fontSize(10)
            .text(`${dateStr} - ${typeLabel} - Rp ${tx.amount.toLocaleString()}${tx.description ? ` (${tx.description})` : ''}`);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Kirim email dengan Nodemailer
exports.sendReportEmail = async (to, user, report) => {
  try {
    // Generate PDF
    const pdfBuffer = await generatePDF(report, user);

    // Kirim email
    const info = await transporter.sendMail({
      from: `"eSaku" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `📊 Laporan Keuangan eSaku - ${new Date().toLocaleDateString()}`,
      text: `Halo ${user.username},\n\nBerikut laporan keuangan Anda untuk periode ${report.period}.\n\nRingkasan:\n- Total Pemasukan: Rp ${report.summary.totalIncome.toLocaleString()}\n- Total Pengeluaran: Rp ${report.summary.totalExpense.toLocaleString()}\n- Balance: Rp ${report.summary.balance.toLocaleString()}\n\nTerima kasih,\neSaku Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2c3e50; text-align: center;">📊 Laporan Keuangan eSaku</h2>
          <p style="font-size: 16px; color: #34495e;">Halo <strong>${user.username}</strong>,</p>
          <p style="font-size: 16px; color: #34495e;">Berikut laporan keuangan Anda untuk periode <strong>${report.period}</strong>.</p>
          <h3 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">📋 Ringkasan</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px; background-color: #e8f5e9; margin: 5px 0; border-radius: 5px;"><strong>✅ Total Pemasukan:</strong> Rp ${report.summary.totalIncome.toLocaleString()}</li>
            <li style="padding: 8px; background-color: #ffebee; margin: 5px 0; border-radius: 5px;"><strong>❌ Total Pengeluaran:</strong> Rp ${report.summary.totalExpense.toLocaleString()}</li>
            <li style="padding: 8px; background-color: #e3f2fd; margin: 5px 0; border-radius: 5px;"><strong>💰 Balance:</strong> Rp ${report.summary.balance.toLocaleString()}</li>
            <li style="padding: 8px; background-color: #f5f5f5; margin: 5px 0; border-radius: 5px;"><strong>📦 Jumlah Transaksi:</strong> ${report.summary.transactionCount}</li>
          </ul>
          ${report.categories && report.categories.length > 0 ? `
            <h3 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; margin-top: 20px;">📂 Kategori Pengeluaran</h3>
            <ul style="list-style: none; padding: 0;">
              ${report.categories.map(cat => `<li style="padding: 6px; background-color: #f8f9fa; margin: 3px 0; border-radius: 5px;">- ${cat.name}: Rp ${cat.total.toLocaleString()}</li>`).join('')}
            </ul>
          ` : ''}
          <p style="margin-top: 20px; font-size: 14px; color: #7f8c8d;">Terima kasih telah menggunakan eSaku! 🙏</p>
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
          <p style="font-size: 12px; color: #bdc3c7; text-align: center;">© 2026 eSaku - Aplikasi Keuangan Pribadi</p>
        </div>
      `,
      attachments: [
        {
          filename: `laporan_${report.period}_${new Date().toISOString().slice(0,10)}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};