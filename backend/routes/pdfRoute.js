const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getPdf, uploadFiles } = require('../controllers/pdfController');
const router = express.Router();

router.get('/getPdf', protect, getPdf);
router.post('/uploadFiles', protect, uploadFiles);

module.exports = router;
