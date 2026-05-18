const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', ctrl.globalSearch);

module.exports = router;
