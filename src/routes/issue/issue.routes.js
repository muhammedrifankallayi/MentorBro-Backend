const express = require('express');
const issueController = require('../../controllers/issue');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student routes
router.post('/', issueController.create);
router.get('/my', issueController.getMyIssues);
router.get('/:id', issueController.getById);

module.exports = router;
