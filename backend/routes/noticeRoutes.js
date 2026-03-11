const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', noticeController.getNotices);
router.post('/', authorize('admin', 'teacher'), noticeController.createNotice);
router.delete('/:id', authorize('admin', 'teacher'), noticeController.deleteNotice);
router.put('/:id', authorize('admin', 'teacher'), noticeController.updateNotice);

module.exports = router;
