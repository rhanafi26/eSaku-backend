const express = require('express');
const { sendMonthlyReport } = require('../controllers/emailController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/send-report', auth, sendMonthlyReport);

module.exports = router;