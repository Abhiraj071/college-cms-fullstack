const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authorize } = require('../middleware/authMiddleware'); // assuming authorize exists if we want it, but usually standard protect handles it. Note: 'authorize' might need role check. 

// Exams
router.get('/', examController.getExams);
router.post('/', examController.createExam);
router.put('/:id', examController.updateExam);
router.delete('/:id', examController.deleteExam);

// Results
router.get('/:examId/marks', examController.getResultsByExam);
router.get('/marks/student/:studentId', examController.getResultsByStudent);
router.post('/marks', examController.saveResult);
router.post('/:examId/results/bulk', examController.bulkImportResults);

module.exports = router;
