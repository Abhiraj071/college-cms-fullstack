const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect } = require('../middleware/authMiddleware');

// All system routes require admin role (not strictly enforced here but usually handled by middleware)
router.get('/export', protect, systemController.exportBackup);
router.post('/import', protect, systemController.importBackup);
router.get('/stats', protect, systemController.getSystemStats);
router.post('/reset', protect, systemController.factoryReset);

module.exports = router;
