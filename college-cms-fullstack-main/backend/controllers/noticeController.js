const Notice = require('../models/Notice');

exports.getNotices = async (req, res) => {
    try {
        // Find notices that have the user's role in targetRoles
        const notices = await Notice.find({
            targetRoles: req.user.role
        }).populate('author', 'name').sort({ date: -1 });

        res.json(notices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createNotice = async (req, res) => {
    try {
        const notice = new Notice({
            ...req.body,
            author: req.user._id
        });
        await notice.save();
        res.status(201).json(notice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Only author or admin can delete
        if (notice.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Notice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notice removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Only author or admin can update
        if (notice.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updated = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
