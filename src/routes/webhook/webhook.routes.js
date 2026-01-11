const express = require('express');
const { handleGitHubWebhook, handleWorkWebhook } = require('../../controllers/webhook/webhook.controller');

const router = express.Router();

/**
 * @route   POST /api/v1/webhook/github
 * @desc    Handle GitHub webhook for auto-deployment
 * @access  Public (no authentication required)
 */
router.post('/github', handleGitHubWebhook);

/**
 * @route   POST /api/v1/webhook/work
 * @desc    Handle webhook for WORK frontend deployment
 * @access  Public
 */
router.post('/work', handleWorkWebhook);

module.exports = router;
