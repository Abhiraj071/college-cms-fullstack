const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', timetableController.getTimetables);
router.post('/', authorize('admin'), timetableController.updateTimetable);
router.delete('/:id', authorize('admin'), timetableController.deleteTimetable);

module.exports = router;
