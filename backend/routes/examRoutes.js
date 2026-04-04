const express = require('express');
const router = express.Router();

// Stub endpoints - returns empty data so frontend doesn't crash
router.get('/', (req, res) => res.json([]));
router.post('/', (req, res) => res.status(201).json({ message: 'Exams not configured' }));
router.put('/:id', (req, res) => res.json({}));
router.delete('/:id', (req, res) => res.json({ message: 'Deleted' }));
router.get('/marks/student/:studentId', (req, res) => res.json([]));
router.get('/:examId/marks', (req, res) => res.json([]));
router.post('/marks', (req, res) => res.json({}));

module.exports = router;
