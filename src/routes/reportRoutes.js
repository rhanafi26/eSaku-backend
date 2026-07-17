const express = require('express');
const { getReport } = require('../controllers/reportController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getReport);

module.exports = router;