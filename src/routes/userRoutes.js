const express = require('express');
const { getProfile, updateNotificationEmail } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/notification-email', auth, updateNotificationEmail);

module.exports = router;