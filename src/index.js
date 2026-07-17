require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'eSaku Backend running!' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes')); // <-- Tambahkan ini
app.use('/api/email', require('./routes/emailRoutes'));
// ... setelah routes lainnya
app.use('/api/users', require('./routes/userRoutes'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});