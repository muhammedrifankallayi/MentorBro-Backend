const EmployeeTask = require('../models/employeeTask.model');
const { AppError } = require('../utils');

/**
 * Create and assign a task to an employee
 */
const createTask = async (taskData) => {
    const { title, description, assignedTo, priority, deadline, subtasks, notes } = taskData;

    if (!title || !assignedTo) {
        throw new AppError('Title and assignedTo are required', 400);
    }

    const task = await EmployeeTask.create({
        title,
        description,
        assignedTo,
        priority,
        deadline: deadline || null,
        subtasks: (subtasks || []).map((s) => ({ title: s.title || s })),
        notes,
    });

    return task.populate({ path: 'assignedTo', select: 'name email' });
};

/**
 * Get all tasks (admin view) with filters and pagination
 */
const getAllForAdmin = async ({ page = 1, limit = 20, search = '', status, priority, employeeId, date } = {}) => {
    const query = { isActive: true };

    if (employeeId) query.assignedTo = employeeId;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Filter tasks by a specific date (matches deadline OR createdAt on that day)
    if (date) {
        const start = new Date(date);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);
        query.$or = [
            { deadline: { $gte: start, $lte: end } },
            { createdAt: { $gte: start, $lte: end } },
        ];
    }

    if (search && search.trim()) {
        query.title = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
        EmployeeTask.find(query)
            .populate({ path: 'assignedTo', select: 'name email' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        EmployeeTask.countDocuments(query),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
};

/**
 * Get a single task by ID
 */
const getById = async (taskId) => {
    const task = await EmployeeTask.findOne({ _id: taskId, isActive: true })
        .populate({ path: 'assignedTo', select: 'name email' });

    if (!task) throw new AppError('Task not found', 404);
    return task;
};

/**
 * Update a task (admin)
 */
const updateTask = async (taskId, updateData) => {
    const allowed = ['title', 'description', 'assignedTo', 'status', 'priority', 'deadline', 'subtasks', 'notes'];
    const filtered = {};

    Object.keys(updateData).forEach((key) => {
        if (allowed.includes(key) && updateData[key] !== undefined) {
            filtered[key] = updateData[key];
        }
    });

    // Auto-set completedAt when status changes to completed
    if (filtered.status === 'completed') filtered.completedAt = new Date();
    if (filtered.status && filtered.status !== 'completed') filtered.completedAt = null;

    const task = await EmployeeTask.findByIdAndUpdate(taskId, filtered, { new: true, runValidators: true })
        .populate({ path: 'assignedTo', select: 'name email' });

    if (!task) throw new AppError('Task not found', 404);
    return task;
};

/**
 * Delete a task (soft delete)
 */
const deleteTask = async (taskId) => {
    const task = await EmployeeTask.findByIdAndUpdate(taskId, { isActive: false }, { new: true });
    if (!task) throw new AppError('Task not found', 404);
    return task;
};

/**
 * Get tasks assigned to a specific employee
 */
const getMyTasks = async (employeeId, { page = 1, limit = 20, status, priority } = {}) => {
    const query = { assignedTo: employeeId, isActive: true };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
        EmployeeTask.find(query)
            .sort({ deadline: 1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        EmployeeTask.countDocuments(query),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
};

/**
 * Employee updates their own task status
 */
const updateMyTaskStatus = async (taskId, employeeId, status) => {
    const task = await EmployeeTask.findOne({ _id: taskId, assignedTo: employeeId, isActive: true });
    if (!task) throw new AppError('Task not found', 404);

    task.status = status;
    if (status === 'completed') task.completedAt = new Date();
    if (status !== 'completed') task.completedAt = null;

    await task.save();
    return task;
};

/**
 * Employee toggles a subtask's completed state
 */
const toggleSubtask = async (taskId, subtaskId, employeeId) => {
    const task = await EmployeeTask.findOne({ _id: taskId, assignedTo: employeeId, isActive: true });
    if (!task) throw new AppError('Task not found', 404);

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) throw new AppError('Subtask not found', 404);

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;

    await task.save();
    return task;
};

module.exports = {
    createTask,
    getAllForAdmin,
    getById,
    updateTask,
    deleteTask,
    getMyTasks,
    updateMyTaskStatus,
    toggleSubtask,
};
