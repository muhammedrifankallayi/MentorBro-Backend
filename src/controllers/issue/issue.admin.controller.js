const issueService = require('../../services/issue.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Get all issues (admin only)
 * @route   GET /api/v1/admin/issues
 * @access  Admin only
 */
const getAllIssues = catchAsync(async (req, res) => {
    const result = await issueService.getAll(req.query);
    ApiResponse.list(res, result.issues, result.pagination, 'Issues retrieved successfully');
});

/**
 * @desc    Get issue by ID (admin only)
 * @route   GET /api/v1/admin/issues/:id
 * @access  Admin only
 */
const getIssueById = catchAsync(async (req, res) => {
    const issue = await issueService.getById(req.params.id);
    ApiResponse.success(res, issue, 'Issue retrieved successfully');
});

/**
 * @desc    Update issue status (admin only)
 * @route   PATCH /api/v1/admin/issues/:id/status
 * @access  Admin only
 */
const updateIssueStatus = catchAsync(async (req, res) => {
    const { status, adminComment } = req.body;
    const issue = await issueService.updateStatus(req.params.id, status, adminComment);
    ApiResponse.success(res, issue, 'Issue status updated successfully');
});

/**
 * @desc    Delete issue (admin only)
 * @route   DELETE /api/v1/admin/issues/:id
 * @access  Admin only
 */
const deleteIssue = catchAsync(async (req, res) => {
    await issueService.remove(req.params.id);
    ApiResponse.success(res, null, 'Issue deleted successfully');
});

/**
 * @desc    Get issue stats (admin only)
 * @route   GET /api/v1/admin/issues/stats
 * @access  Admin only
 */
const getIssueStats = catchAsync(async (req, res) => {
    const stats = await issueService.getStats();
    ApiResponse.success(res, stats, 'Issue stats retrieved successfully');
});

module.exports = {
    getAllIssues,
    getIssueById,
    updateIssueStatus,
    deleteIssue,
    getIssueStats,
};
