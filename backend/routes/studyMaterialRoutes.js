const express = require('express');
const router = express.Router();
const studyMaterialController = require('../controllers/studyMaterialController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, studyMaterialController.getStudyMaterials);
router.post('/', protect, authorize('admin'), studyMaterialController.createStudyMaterial);
router.delete('/:id', protect, authorize('admin'), studyMaterialController.deleteStudyMaterial);

module.exports = router;
