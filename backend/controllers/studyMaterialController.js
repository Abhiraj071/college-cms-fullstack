const StudyMaterial = require('../models/StudyMaterial');

exports.getStudyMaterials = async (req, res) => {
    try {
        const { course, subject } = req.query;
        let query = {};
        if (course) query.course = course;
        if (subject) query.subject = subject;

        const materials = await StudyMaterial.find(query)
            .populate('subject', 'name')
            .populate('faculty', 'name')
            .lean()
            .sort({ createdAt: -1 });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createStudyMaterial = async (req, res) => {
    try {
        const material = new StudyMaterial({
            ...req.body,
            faculty: req.user._id
        });
        await material.save();
        res.status(201).json(material);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteStudyMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        if (material.faculty.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await StudyMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
