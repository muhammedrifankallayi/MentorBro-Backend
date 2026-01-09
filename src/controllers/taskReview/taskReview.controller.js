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
    getNextWeekForStudent,
    bulkUpdate,
};

