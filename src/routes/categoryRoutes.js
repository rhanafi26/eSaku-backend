const express = require('express');
const { getIncomeTypes, getExpenseTypes } = require('../controllers/categoryController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/income', auth, getIncomeTypes);
router.get('/expense', auth, getExpenseTypes);

module.exports = router;