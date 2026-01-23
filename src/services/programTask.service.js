const ProgramTask = require('../models/programTask.model');
const { AppError } = require('../utils');

/**
 * Create a new program task
 * @param {Object} taskData - Program task data
 * @returns {Promise<Object>} Created program task
 */
const create = async (taskData) => {
    const programTask = await ProgramTask.create(taskData);
    return await programTask.populate('program', 'name totalWeeks');
};

/**
 * Get all program tasks with optional filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Program tasks list with pagination info
 */
const getAll = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'week',
        sortOrder = 'asc',
        search,
        program,
    } = queryParams;

    // Build filter
    const filter = {};

    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    if (program) {
        filter.program = program;
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [programTasks, total] = await Promise.all([
        ProgramTask.find(filter)
            .populate('program', 'name totalWeeks')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        ProgramTask.countDocuments(filter),
    ]);

    return {
        programTasks,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get program task by ID
 * @param {string} id - Program task ID
 * @returns {Promise<Object>} Program task
 */
const getById = async (id) => {
    const programTask = await ProgramTask.findById(id).populate('program', 'name totalWeeks');

    if (!programTask) {
        throw new AppError('Program task not found', 404);
    }

    return programTask;
};

/**
 * Get program tasks by program ID
 * @param {string} programId - Program ID
 * @returns {Promise<Array>} Program tasks
 */
const getByProgramId = async (programId) => {
    const programTasks = await ProgramTask.find({ program: programId })
        .populate('program', 'name totalWeeks')
        .sort({ week: 1 });

    return programTasks;
};

/**
 * Update program task by ID
 * @param {string} id - Program task ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated program task
 */
const update = async (id, updateData) => {
    const programTask = await ProgramTask.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    ).populate('program', 'name totalWeeks');

    if (!programTask) {
        throw new AppError('Program task not found', 404);
    }

    return programTask;
};

/**
 * Delete program task by ID (soft delete)
 * @param {string} id - Program task ID
 * @returns {Promise<Object>} Deleted program task
 */
const remove = async (id) => {
    const programTask = await ProgramTask.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
    );

    if (!programTask) {
        throw new AppError('Program task not found', 404);
    }

    return programTask;
};

/**
 * Get next week number for a program
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Next week number
 */
const getNextWeek = async (programId) => {
    // Count total tasks (including inactive ones) for this program
    const totalTasks = await ProgramTask.countDocuments({ program: programId })
        .setOptions({ skipIsActiveFilter: true });

    const nextWeek = totalTasks + 1;

    return { nextWeek };
};

module.exports = {
    create,
    getAll,
    getById,
    getByProgramId,
    update,
    remove,
    getNextWeek,
};


