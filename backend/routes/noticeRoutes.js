const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', noticeController.getNotices);
router.post('/', authorize('admin'), noticeController.createNotice);
router.delete('/:id', authorize('admin'), noticeController.deleteNotice);
router.put('/:id', authorize('admin'), noticeController.updateNotice);

module.exports = router;
