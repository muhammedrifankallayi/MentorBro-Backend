const express = require('express');
const studentRoutes = require('./student');
const reviewerRoutes = require('./reviewer');
const adminRoutes = require('./admin');
const batchRoutes = require('./batch');
const programRoutes = require('./program');
const programTaskRoutes = require('./programTask');
const taskReviewRoutes = require('./taskReview');
const webhookRoutes = require('./webhook/webhook.routes');
const uploadRoutes = require('./upload');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

// Mount routes
router.use('/student', studentRoutes);
router.use('/reviewer', reviewerRoutes);
router.use('/admin', adminRoutes);
router.use('/batch', batchRoutes);
router.use('/program', programRoutes);
router.use('/program-task', programTaskRoutes);
router.use('/task-review', taskReviewRoutes);
router.use('/webhook', webhookRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;




