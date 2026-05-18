const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendEmail, lowAttendanceAlert } = require('../services/emailService');
const Student  = require('../models/Student');
const rateLimit = require('express-rate-limit');

// Rate-limit email sends — max 20 per hour per IP
const emailLimiter = rateLimit({ windowMs: 60*60*1000, max: 20 });

router.use(protect);
router.use(emailLimiter);

// POST /api/email/low-attendance  — admin triggers alerts for all low-attendance students
router.post('/low-attendance', authorize('admin'), async (req, res) => {
    try {
        const threshold = parseFloat(req.body.threshold) || 0.75;
        const students  = await Student.find({
            totalClasses: { $gt: 0 },
            $expr: { $lt: [{ $divide: ['$present', '$totalClasses'] }, threshold] }
        }).lean();

        if (students.length === 0) {
            return res.json({ sent: 0, message: 'No students below threshold.' });
        }

        const results = await Promise.allSettled(
            students.map(s => lowAttendanceAlert({
                studentName: s.name,
                email:       s.email,
                rollNo:      s.rollNo,
                course:      s.course,
                semester:    s.semester,
                percentage:  s.attendancePercentage,
            }))
        );

        const sent = results.filter(r => r.status === 'fulfilled' && r.value.sent).length;
        res.json({ sent, total: students.length, message: `Sent ${sent}/${students.length} alerts.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/email/custom  — admin sends a custom email to a recipient
router.post('/custom', authorize('admin'), async (req, res) => {
    try {
        const { to, subject, html, text } = req.body;
        if (!to || !subject) return res.status(400).json({ message: 'to and subject are required' });
        const result = await sendEmail({ to, subject, html: html || `<p>${text || ''}</p>`, text });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
