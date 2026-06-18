const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/examController');

// ── Public Routes (No authentication required) ──────────────────────────────
router.get('/',                          ctrl.getExams); // Also public for portal dropdown
router.get('/public/result',             ctrl.getPublicResult); 

// ── Protected Routes (Requires login) ────────────────────────────────────────
router.use(protect); 

router.get('/marks/student/:studentId',   ctrl.getMarksByStudent);
router.get('/results/student/:studentId', ctrl.getStudentResultSummary);
router.get('/results/semester-wise/:studentId', ctrl.getSemesterWiseResults);
router.get('/supplementary-subjects',     ctrl.getSupplementarySubjects);
router.get('/stats/dashboard',            ctrl.getExamStats);

router.get('/marks', authorize('admin'), ctrl.getAllMarks);

router.get('/:examId/marks',              ctrl.getMarksByExam);
router.get('/:id',                        ctrl.getExamById);

router.post('/',           authorize('admin'), ctrl.createExam);
router.put('/:id',         authorize('admin'), ctrl.updateExam);
router.delete('/:id',      authorize('admin'),            ctrl.deleteExam);

// ── Marks ────────────────────────────────────────────────────────────────────
router.post('/marks', authorize('admin'), ctrl.upsertMark);
router.post('/marks/bulk', authorize('admin'), ctrl.bulkUpsertMarks);

module.exports = router;
