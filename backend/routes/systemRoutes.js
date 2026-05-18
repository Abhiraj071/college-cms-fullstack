const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
// Note: protect + authorize('admin') is already applied in server.js for /api/system

router.get('/export', systemController.exportBackup);
router.post('/import', systemController.importBackup);
router.get('/stats', systemController.getSystemStats);
router.post('/reset', systemController.factoryReset);

// Settings
router.get('/settings', systemController.getSettings);
router.post('/settings', systemController.updateSetting);

module.exports = router;
