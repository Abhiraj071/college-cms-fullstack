const Alumni = require('../models/Alumni');

exports.getAlumni = async (req, res) => {
    try {
        const alumni = await Alumni.find({}).sort({ graduationDate: -1 });
        res.json(alumni);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
