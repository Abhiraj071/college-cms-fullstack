const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', examController.getExams);
router.post('/', authorize('admin', 'teacher'), examController.createExam);
router.delete('/:id', authorize('admin'), examController.deleteExam);
router.put('/:id', authorize('admin', 'teacher'), examController.updateExam);

// Marks
router.get('/:examId/marks', examController.getMarksByExam);
router.get('/marks/student/:studentId', protect, examController.getStudentMarks);
router.post('/marks', authorize('admin', 'teacher'), examController.updateMarks);

module.exports = router;
