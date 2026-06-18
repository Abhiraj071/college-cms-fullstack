const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/export', protect, authorize('admin'), systemController.exportBackup);
router.post('/import', protect, authorize('admin'), systemController.importBackup);
router.get('/stats', protect, authorize('admin'), systemController.getSystemStats);
router.post('/reset', protect, authorize('admin'), systemController.factoryReset);

// Settings
router.get('/settings', systemController.getSettings);
router.post('/settings', protect, authorize('admin'), systemController.updateSetting);

module.exports = router;
