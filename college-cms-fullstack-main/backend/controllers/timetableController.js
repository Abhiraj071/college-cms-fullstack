const Timetable = require('../models/Timetable');

exports.getTimetables = async (req, res) => {
    try {
        const query = {};
        if (req.query.course) query.course = req.query.course.trim();
        if (req.query.year) query.year = Number(req.query.year);
        if (req.query.semester) query.semester = Number(req.query.semester);

        const timetables = await Timetable.find(query).lean();
        res.json(timetables);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTimetable = async (req, res) => {
    const { course, year, semester, days, timeSlots, grid } = req.body;
    console.log('TIMETABLE UPDATE:', { course, year, semester });
    console.log('Data:', { daysLen: days?.length, slotsLen: timeSlots?.length, gridKeys: Object.keys(grid || {}).length });
    try {
        const query = {
            course: course.trim(),
            year: Number(year),
            semester: Number(semester)
        };

        const update = {
            $set: {
                days: days,
                timeSlots: timeSlots,
                grid: grid
            }
        };

        const record = await Timetable.findOneAndUpdate(
            query,
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json(record);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTimetable = async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Timetable entry removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
