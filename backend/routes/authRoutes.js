const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
// Register is admin-only: you must be logged in as admin to create new user accounts
router.post('/register', protect, authorize('admin'), authController.register);

module.exports = router;
