const express = require('express');
const { handleGitHubWebhook } = require('../../controllers/webhook/webhook.controller');

const router = express.Router();

/**
 * @route   POST /api/v1/webhook/github
 * @desc    Handle GitHub webhook for auto-deployment
 * @access  Public (no authentication required)
 */
router.post('/github', handleGitHubWebhook);

module.exports = router;
