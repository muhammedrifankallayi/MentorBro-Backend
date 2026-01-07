const TaskReview = require('../models/taskReview.model');
const { AppError } = require('../utils');

/**
 * Create a new task review
 * @param {Object} reviewData - Task review data
 * @returns {Promise<Object>} Created task review
 */
const create = async (reviewData) => {
    const taskReview = await TaskReview.create(reviewData);

    // Fetch the created document with populated fields
    return await TaskReview.findById(taskReview._id)
        .populate('student', 'name email')
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week')
        .populate('reviewer', 'username');
};

/**
 * Get all task reviews with optional filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Task reviews list with pagination info
 */
const getAll = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'scheduledDate',
        sortOrder = 'desc',
        student,
        reviewer,
        program,
        isReviewCompleted,
        reviewStatus,
    } = queryParams;

    // Build filter
    const filter = {};

    if (student) filter.student = student;

    // Handle reviewer filter - support for unassigned reviews
    if (reviewer !== undefined) {
        if (reviewer === 'null' || reviewer === 'unassigned' || reviewer === '') {
            // Get reviews where reviewer is not assigned (null or doesn't exist)
            filter.reviewer = { $in: [null, undefined] };
        } else {
            // Get reviews for specific reviewer
            filter.reviewer = reviewer;
        }
    }

    if (program) filter.program = program;
    if (isReviewCompleted !== undefined) filter.isReviewCompleted = isReviewCompleted === 'true';
    if (reviewStatus) filter.reviewStatus = reviewStatus;

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [taskReviews, total] = await Promise.all([
        TaskReview.find(filter)
            .populate('student', 'name email')
            .populate('program', 'name totalWeeks')
            .populate('programTask', 'name week')
            .populate('reviewer', 'username fullName')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        TaskReview.countDocuments(filter),
    ]);

    return {
        taskReviews,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get task review by ID
 * @param {string} id - Task review ID
 * @returns {Promise<Object>} Task review
 */
const getById = async (id) => {
    const taskReview = await TaskReview.findById(id)
        .populate('student', 'name email')
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week tasks')
        .populate('reviewer', 'username fullName');

    if (!taskReview) {
        throw new AppError('Task review not found', 404);
    }

    return taskReview;
};

/**
 * Get task reviews by student ID
 * @param {string} studentId - Student ID
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Task reviews
 */
const getByStudentId = async (studentId, queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'scheduledDate',
        sortOrder = 'desc',
    } = queryParams;

    const filter = { student: studentId };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [taskReviews, total] = await Promise.all([
        TaskReview.find(filter)
            .populate('student', 'name email')
            .populate('program', 'name totalWeeks')
            .populate('programTask', 'name week')
            .populate('reviewer', 'username fullName')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        TaskReview.countDocuments(filter),
    ]);

    return {
        taskReviews,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get task reviews by reviewer ID
 * @param {string} reviewerId - Reviewer ID
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Task reviews
 */
const getByReviewerId = async (reviewerId, queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'scheduledDate',
        sortOrder = 'desc',
    } = queryParams;

    const filter = { reviewer: reviewerId };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [taskReviews, total] = await Promise.all([
        TaskReview.find(filter)
            .populate('student', 'name email')
            .populate('program', 'name totalWeeks')
            .populate('programTask', 'name week')
            .populate('reviewer', 'username fullName')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        TaskReview.countDocuments(filter),
    ]);

    return {
        taskReviews,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Update task review by ID
 * @param {string} id - Task review ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated task review
 */
const update = async (id, updateData) => {
    const taskReview = await TaskReview.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    )
        .populate('student', 'name email')
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week')
        .populate('reviewer', 'username fullName');

    if (!taskReview) {
        throw new AppError('Task review not found', 404);
    }

    return taskReview;
};

/**
 * Delete task review by ID (soft delete)
 * @param {string} id - Task review ID
 * @returns {Promise<Object>} Deleted task review
 */
const remove = async (id) => {
    const taskReview = await TaskReview.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
    );

    if (!taskReview) {
        throw new AppError('Task review not found', 404);
    }

    return taskReview;
};

/**
 * Cancel task review by ID
 * @param {string} id - Task review ID
 * @returns {Promise<Object>} Cancelled task review
 */
const cancel = async (id) => {
    const taskReview = await TaskReview.findByIdAndUpdate(
        id,
        { isCancelled: true },
        { new: true }
    )
        .populate('student', 'name email')
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week')
        .populate('reviewer', 'username fullName');

    if (!taskReview) {
        throw new AppError('Task review not found', 404);
    }

    return taskReview;
};

/**
 * Assign reviewer to a task review
 * @param {string} id - Task review ID
 * @param {string} reviewerId - Reviewer ID to assign
 * @returns {Promise<Object>} Updated task review
 */
const assignReviewer = async (id, reviewerId) => {
    // First check if task review exists
    const taskReview = await TaskReview.findById(id);

    if (!taskReview) {
        throw new AppError('Task review not found', 404);
    }

    // Check if task review is already cancelled
    if (taskReview.isCancelled) {
        throw new AppError('Cannot assign reviewer to a cancelled task review', 400);
    }

    // Check if task review is already completed
    if (taskReview.isReviewCompleted) {
        throw new AppError('Cannot assign reviewer to a completed task review', 400);
    }

    // Update the reviewer
    const updatedTaskReview = await TaskReview.findByIdAndUpdate(
        id,
        { reviewer: reviewerId },
        {
            new: true,
            runValidators: true,
        }
    )
        .populate('student', 'name email')
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week')
        .populate('reviewer', 'fullName username email mobileNo');

    return updatedTaskReview;
};

module.exports = {
    create,
    getAll,
    getById,
    getByStudentId,
    getByReviewerId,
    update,
    remove,
    cancel,
    assignReviewer,
};

