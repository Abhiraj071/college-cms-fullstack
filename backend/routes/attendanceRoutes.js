const express               = require('express');
const router                = express.Router();
const attendanceController  = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',  attendanceController.getAttendance);
router.post('/', authorize('admin', 'teacher'), attendanceController.markAttendance);
router.get('/student/:studentId', attendanceController.getStudentAttendance);

router.post('/session', authorize('admin', 'teacher'), attendanceController.generateSession);
router.post('/mark-self', authorize('student'), attendanceController.markSelfAttendance);

module.exports = router;
