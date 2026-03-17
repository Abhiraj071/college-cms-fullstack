const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/uploadMiddleware');
// Note: this router is mounted under protect middleware in server.js

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).json({
        message: 'File uploaded successfully',
        fileName: req.file.filename,
        filePath,
    });
});

module.exports = router;
