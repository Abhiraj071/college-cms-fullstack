const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { loginSchema } = require('../middleware/schemas/authSchemas');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', validate(loginSchema), authController.login);
// Register is admin-only: you must be logged in as admin to create new user accounts
router.post('/register', protect, authorize('admin'), authController.register);

module.exports = router;
