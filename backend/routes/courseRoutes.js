const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Branches
router.get('/branches', courseController.getBranches);
router.post('/branches', authorize('admin'), courseController.createBranch);
router.delete('/branches/:id', authorize('admin'), courseController.deleteBranch);

// Courses
router.get('/', courseController.getCourses);
router.post('/', authorize('admin'), courseController.createCourse);
router.delete('/:id', authorize('admin'), courseController.deleteCourse);
router.put('/:id', authorize('admin'), courseController.updateCourse);

module.exports = router;
