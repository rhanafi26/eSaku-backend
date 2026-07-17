const express = require('express');
const {
  createTransaction,
  getTransactions,
  syncTransactions,
  deleteTransaction,
} = require('../controllers/transactionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, createTransaction);
router.get('/', auth, getTransactions);
router.post('/sync', auth, syncTransactions);
router.delete('/:id', auth, deleteTransaction);

module.exports = router;