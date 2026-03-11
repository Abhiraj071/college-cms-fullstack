const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }
    // Return relative path for frontend usage
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).json({
        message: 'File uploaded successfully',
        fileName: req.file.filename,
        filePath: filePath
    });
});

module.exports = router;
