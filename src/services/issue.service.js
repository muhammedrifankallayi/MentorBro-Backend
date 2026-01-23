const Issue = require('../models/issue.model');
const { AppError } = require('../utils');

/**
 * Create a new issue
 * @param {Object} issueData - Issue data
 * @returns {Promise<Object>} Created issue
 */
const create = async (issueData) => {
    const issue = await Issue.create(issueData);

    const populatedIssue = await Issue.findById(issue._id)
        .populate('student', 'name email');

    return populatedIssue;
};

/**
 * Get all issues with optional filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Issues list with pagination info
 */
const getAll = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        student,
    } = queryParams;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (student) filter.student = student;

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [issues, total] = await Promise.all([
        Issue.find(filter)
            .populate('student', 'name email batch')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Issue.countDocuments(filter),
    ]);

    return {
        issues,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get issue by ID
 * @param {string} id - Issue ID
 * @returns {Promise<Object>} Issue
 */
const getById = async (id) => {
    const issue = await Issue.findById(id)
        .populate('student', 'name email batch');

    if (!issue) {
        throw new AppError('Issue not found', 404);
    }

    return issue;
};

/**
 * Get issues by student ID
 * @param {string} studentId - Student ID
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Issues
 */
const getByStudentId = async (studentId, queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = queryParams;

    const filter = { student: studentId };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
        Issue.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Issue.countDocuments(filter),
    ]);

    return {
        issues,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Update issue by ID
 * @param {string} id - Issue ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated issue
 */
const update = async (id, updateData) => {
    const issue = await Issue.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    ).populate('student', 'name email batch');

    if (!issue) {
        throw new AppError('Issue not found', 404);
    }

    return issue;
};

/**
 * Update issue status (admin only)
 * @param {string} id - Issue ID
 * @param {string} status - New status
 * @param {string} adminComment - Optional admin comment
 * @returns {Promise<Object>} Updated issue
 */
const updateStatus = async (id, status, adminComment) => {
    const updateData = { status };
    if (adminComment !== undefined) {
        updateData.adminComment = adminComment;
    }

    const issue = await Issue.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    ).populate('student', 'name email batch');

    if (!issue) {
        throw new AppError('Issue not found', 404);
    }

    return issue;
};

/**
 * Delete issue by ID (soft delete)
 * @param {string} id - Issue ID
 * @returns {Promise<Object>} Deleted issue
 */
const remove = async (id) => {
    const issue = await Issue.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
    );

    if (!issue) {
        throw new AppError('Issue not found', 404);
    }

    return issue;
};

/**
 * Get issue stats for admin dashboard
 * @returns {Promise<Object>} Stats
 */
const getStats = async () => {
    const stats = await Issue.aggregate([
        { $match: { isActive: { $ne: false } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const result = {
        pending: 0,
        considered: 0,
        fixed: 0,
        total: 0,
    };

    stats.forEach((item) => {
        result[item._id] = item.count;
        result.total += item.count;
    });

    return result;
};

module.exports = {
    create,
    getAll,
    getById,
    getByStudentId,
    update,
    updateStatus,
    remove,
    getStats,
};
