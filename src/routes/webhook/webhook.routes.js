const express = require('express');
const { handleGitHubWebhook, handleWorkWebhook, handleLearnWebhook } = require('../../controllers/webhook/webhook.controller');

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

/**
 * @route   POST /api/v1/webhook/learn
 * @desc    Handle webhook for LEARN frontend deployment
 * @access  Public
 */
router.post('/learn', handleLearnWebhook);

module.exports = router;
