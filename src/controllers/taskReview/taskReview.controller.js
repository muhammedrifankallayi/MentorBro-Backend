const taskReviewService = require('../../services/taskReview.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Create a new task review
 * @route   POST /api/v1/task-review
 * @access  Admin only
 */
const create = catchAsync(async (req, res) => {
    const taskReview = await taskReviewService.create(req.body);
    ApiResponse.success(res, taskReview, 'Task review created successfully', 201);
});

/**
 * @desc    Get all task reviews
 * @route   GET /api/v1/task-review
 * @access  Public
 */
const getAll = catchAsync(async (req, res) => {
    const result = await taskReviewService.getAll(req.query);
    ApiResponse.list(res, result.taskReviews, result.pagination, 'Task reviews retrieved successfully');
});

/**
 * @desc    Get task review by ID
 * @route   GET /api/v1/task-review/:id
 * @access  Public
 */
const getById = catchAsync(async (req, res) => {
    const taskReview = await taskReviewService.getById(req.params.id);
    ApiResponse.success(res, taskReview, 'Task review retrieved successfully');
});

/**
 * @desc    Get task reviews by student ID
 * @route   GET /api/v1/task-review/student/:studentId
 * @access  Public
 */
const getByStudentId = catchAsync(async (req, res) => {
    const result = await taskReviewService.getByStudentId(req.params.studentId, req.query);
    ApiResponse.list(res, result.taskReviews, result.pagination, 'Task reviews retrieved successfully');
});

/**
 * @desc    Get task reviews by reviewer ID
 * @route   GET /api/v1/task-review/reviewer/:reviewerId
 * @access  Public
 */
const getByReviewerId = catchAsync(async (req, res) => {
    const result = await taskReviewService.getByReviewerId(req.params.reviewerId, req.query);
    ApiResponse.list(res, result.taskReviews, result.pagination, 'Task reviews retrieved successfully');
});

/**
 * @desc    Update task review
 * @route   PUT /api/v1/task-review/:id
 * @access  Admin only
 */
const update = catchAsync(async (req, res) => {
    const taskReview = await taskReviewService.update(req.params.id, req.body);
    ApiResponse.success(res, taskReview, 'Task review updated successfully');
});

/**
 * @desc    Delete task review
 * @route   DELETE /api/v1/task-review/:id
 * @access  Admin only
 */
const remove = catchAsync(async (req, res) => {
    await taskReviewService.remove(req.params.id);
    ApiResponse.success(res, null, 'Task review deleted successfully');
});

/**
 * @desc    Cancel task review
 * @route   PATCH /api/v1/task-review/:id/cancel
 * @access  Protected
 */
const cancel = catchAsync(async (req, res) => {
    const taskReview = await taskReviewService.cancel(req.params.id);
    ApiResponse.success(res, taskReview, 'Task review cancelled successfully');
});

/**
 * @desc    Assign reviewer to task review
 * @route   PATCH /api/v1/task-review/:id/assign-reviewer
 * @access  Protected (Admin)
 */
const assignReviewer = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reviewerId } = req.body;

    if (!reviewerId) {
        throw new ApiResponse.error(res, 'Reviewer ID is required', 400);
    }

    const taskReview = await taskReviewService.assignReviewer(id, reviewerId);
    ApiResponse.success(res, taskReview, 'Reviewer assigned successfully');
});

/**
 * @desc    Get next week task for a student
 * @route   GET /api/v1/task-review/next-week/:studentId
 * @access  Protected
 */
const getNextWeekForStudent = catchAsync(async (req, res) => {
    const { studentId } = req.params;
    const data = await taskReviewService.getNextWeekForStudent(studentId);
    ApiResponse.success(res, data, 'Next week task retrieved successfully');
});

/**
 * @desc    Bulk update multiple task reviews
 * @route   PATCH /api/v1/task-review/bulk-update
 * @access  Admin only
 */
const bulkUpdate = catchAsync(async (req, res) => {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
        return ApiResponse.error(res, 'Updates array is required', 400);
    }

    const result = await taskReviewService.bulkUpdate(updates);
    ApiResponse.success(res, result, 'Bulk update completed');
});

/**
 * @desc    Get last task review for a student
 * @route   GET /api/v1/task-review/last-review/:studentId
 * @access  Protected
 */
const getLastReviewForStudent = catchAsync(async (req, res) => {
    const { studentId } = req.params;
    const taskReview = await taskReviewService.getLastReviewForStudent(studentId);
    ApiResponse.success(res, taskReview, 'Last task review retrieved successfully');
});

/**
 * @desc    Get reviewer earnings for dashboard graph
 * @route   GET /api/v1/task-review/reviewer/:reviewerId/earnings
 * @access  Protected
 */
const getReviewerEarnings = catchAsync(async (req, res) => {
    const { reviewerId } = req.params;
    const result = await taskReviewService.getReviewerEarnings(reviewerId, req.query);
    ApiResponse.success(res, result, 'Reviewer earnings retrieved successfully');
});

/**
 * @desc    Get admin stats (pending payment, completed reviews, unassigned reviews)
 * @route   GET /api/v1/task-review/admin/stats
 * @access  Admin only
 */
const getAdminStats = catchAsync(async (req, res) => {
    const stats = await taskReviewService.getAdminStats(req.query);
    ApiResponse.success(res, stats, 'Admin stats retrieved successfully');
});

/**
 * @desc    Unassign reviewer from task review
 * @route   PATCH /api/v1/task-review/:id/unassign-reviewer
 * @access  Protected (Admin)
 */
const unassignReviewer = catchAsync(async (req, res) => {
    const { id } = req.params;
    const taskReview = await taskReviewService.unassignReviewer(id);
    ApiResponse.success(res, taskReview, 'Reviewer unassigned successfully');
});

module.exports = {
    getLastReviewForStudent,
    create,
    getAll,
    getById,
    getByStudentId,
    getByReviewerId,
    update,
    remove,
    cancel,
    assignReviewer,
    unassignReviewer,
    getNextWeekForStudent,
    bulkUpdate,
    getReviewerEarnings,
    getAdminStats,
};

