const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', subjectController.getSubjects);
router.post('/', authorize('admin'), subjectController.createSubject);
router.put('/:id', authorize('admin'), subjectController.updateSubject);
router.delete('/:id', authorize('admin'), subjectController.deleteSubject);

module.exports = router;
