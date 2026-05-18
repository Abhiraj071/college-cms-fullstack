const Student  = require('../models/Student');
const Faculty  = require('../models/Faculty');
const Subject  = require('../models/Subject');
const Notice   = require('../models/Notice');
const Course   = require('../models/Course');

// GET /api/search?q=<query>
exports.globalSearch = async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.json({ students: [], faculty: [], subjects: [], notices: [], courses: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    try {
        const [students, faculty, subjects, notices, courses] = await Promise.all([
            Student.find({ $or: [{ name: regex }, { rollNo: regex }, { email: regex }] })
                .select('name rollNo course semester email')
                .lean().limit(8),

            Faculty.find({ $or: [{ name: regex }, { department: regex }, { email: regex }] })
                .select('name department designation email')
                .lean().limit(8),

            Subject.find({ $or: [{ name: regex }, { code: regex }] })
                .select('name code course semester type')
                .lean().limit(8),

            Notice.find({ $or: [{ title: regex }, { content: regex }] })
                .select('title category date')
                .lean().limit(5),

            Course.find({ name: regex })
                .select('name code duration')
                .lean().limit(5),
        ]);

        res.json({ students, faculty, subjects, notices, courses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
