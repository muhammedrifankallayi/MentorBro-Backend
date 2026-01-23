const issueService = require('../../services/issue.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Create a new issue
 * @route   POST /api/v1/issues
 * @access  Private (Student)
 */
const create = catchAsync(async (req, res) => {
    const issueData = {
        ...req.body,
        student: req.user.id,
    };

    const issue = await issueService.create(issueData);
    ApiResponse.success(res, issue, 'Issue reported successfully', 201);
});

/**
 * @desc    Get my issues
 * @route   GET /api/v1/issues/my
 * @access  Private (Student)
 */
const getMyIssues = catchAsync(async (req, res) => {
    const result = await issueService.getByStudentId(req.user.id, req.query);
    ApiResponse.list(res, result.issues, result.pagination, 'Issues retrieved successfully');
});

/**
 * @desc    Get issue by ID
 * @route   GET /api/v1/issues/:id
 * @access  Private (Student - own issues only)
 */
const getById = catchAsync(async (req, res) => {
    const issue = await issueService.getById(req.params.id);

    // Check if the student owns this issue
    if (issue.student._id.toString() !== req.user.id) {
        return ApiResponse.error(res, 'You are not authorized to view this issue', 403);
    }

    ApiResponse.success(res, issue, 'Issue retrieved successfully');
});

module.exports = {
    create,
    getMyIssues,
    getById,
};
