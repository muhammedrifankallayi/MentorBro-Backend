const express = require('express');
const employeeTaskService = require('../../services/employeeTask.service');
const { catchAsync, ApiResponse } = require('../../utils');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Get all tasks assigned to the logged-in employee
router.get('/', catchAsync(async (req, res) => {
    const { page = 1, limit = 20, status, priority } = req.query;
    const result = await employeeTaskService.getMyTasks(req.user._id, { page, limit, status, priority });
    ApiResponse.list(res, result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
    }, 'Tasks retrieved successfully');
}));

// Get a single task
router.get('/:id', catchAsync(async (req, res) => {
    const task = await employeeTaskService.getById(req.params.id);
    // Ensure employee can only view their own tasks
    if (task.assignedTo._id.toString() !== req.user._id.toString()) {
        const { AppError } = require('../../utils');
        throw new AppError('Not authorized to view this task', 403);
    }
    ApiResponse.success(res, task, 'Task retrieved successfully');
}));

// Update task status
router.patch('/:id/status', catchAsync(async (req, res) => {
    const { status } = req.body;
    const task = await employeeTaskService.updateMyTaskStatus(req.params.id, req.user._id, status);
    ApiResponse.success(res, task, 'Task status updated');
}));

// Toggle subtask completed
router.patch('/:id/subtasks/:subtaskId/toggle', catchAsync(async (req, res) => {
    const task = await employeeTaskService.toggleSubtask(req.params.id, req.params.subtaskId, req.user._id);
    ApiResponse.success(res, task, 'Subtask updated');
}));

module.exports = router;
