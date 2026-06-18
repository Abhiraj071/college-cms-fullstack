const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examApplicationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes require login

router.get('/eligible-exams', ctrl.getEligibleExams);
router.get('/:examId/form-details', ctrl.getExamFormDetails);
router.post('/submit', ctrl.submitApplication);
router.get('/verify-payment', ctrl.verifyPayment);
router.get('/:examId/admit-card', ctrl.getAdmitCard);

module.exports = router;
