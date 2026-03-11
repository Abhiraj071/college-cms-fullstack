const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all student routes

router.get('/', studentController.getStudents);
router.post('/', authorize('admin'), studentController.createStudent);
router.post('/bulk', authorize('admin'), studentController.createBulkStudents);
router.delete('/:id', authorize('admin'), studentController.deleteStudent);
router.put('/:id', authorize('admin'), studentController.updateStudent);

module.exports = router;
