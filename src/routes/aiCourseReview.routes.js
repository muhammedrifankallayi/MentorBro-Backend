const express = require('express');
const { addReview, getList, deleteReview } = require('../controllers/aiCourseReview.controller');

const router = express.Router();

/**
 * @route   GET /api/v1/ai-course-reviews
 * @desc    Get all AI course reviews
 * @access  Public
 */
router.get('/', getList);

/**
 * @route   POST /api/v1/ai-course-reviews
 * @desc    Add a new AI course review
 * @access  Public
 */
router.post('/', addReview);

/**
 * @route   DELETE /api/v1/ai-course-reviews/:id
 * @desc    Delete an AI course review
 * @access  Public
 */
router.delete('/:id', deleteReview);

module.exports = router;
