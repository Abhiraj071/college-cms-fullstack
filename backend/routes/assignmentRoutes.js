const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, assignmentController.getAssignments);

// 'file' is the key name expected in FormData
router.post('/', protect, authorize('admin'), upload.single('file'), assignmentController.createAssignment);

router.post('/:id/submit', protect, authorize('student'), upload.single('file'), assignmentController.submitAssignment);

router.put('/:id/grade/:submissionId', protect, authorize('admin'), assignmentController.gradeSubmission);
router.delete('/:id', protect, authorize('admin'), assignmentController.deleteAssignment);

module.exports = router;
