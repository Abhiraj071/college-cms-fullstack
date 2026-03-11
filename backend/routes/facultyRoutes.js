const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', facultyController.getAllFaculty);
router.post('/', authorize('admin'), facultyController.createFaculty);
router.post('/bulk', authorize('admin'), facultyController.createBulkFaculty);
router.delete('/:id', authorize('admin'), facultyController.deleteFaculty);
router.put('/:id', authorize('admin'), facultyController.updateFaculty);

module.exports = router;
