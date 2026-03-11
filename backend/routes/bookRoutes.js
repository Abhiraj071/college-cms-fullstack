const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', bookController.getBooks);
router.post('/', authorize('admin'), bookController.createBook);
router.put('/:id', authorize('admin'), bookController.updateBook);
router.delete('/:id', authorize('admin'), bookController.deleteBook);

module.exports = router;
