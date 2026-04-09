const ProgramTask = require('../models/programTask.model');
const { AppError } = require('../utils');

/**
 * Create a new program task
 * @param {Object} taskData - Program task data
 * @returns {Promise<Object>} Created program task
 */
const create = async (taskData) => {
    // Explicitly check for duplicate active tasks for the same program and week
    const existingTask = await ProgramTask.findOne({ 
        program: taskData.program, 
        week: taskData.week,
        isActive: true 
    }).setOptions({ skipIsActiveFilter: true }); // Ensure we catch it based purely on state

    if (existingTask) {
        throw new AppError(`An active task for week ${taskData.week} already exists for this program. Please use a different week.`, 400);
    }

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
    // If they are changing the program or the week, verify it won't trigger a duplicate key
    if (updateData.program || updateData.week) {
        // Fetch current to merge program/week data to see the intended final state
        const currentTask = await ProgramTask.findById(id).setOptions({ skipIsActiveFilter: true });
        if (currentTask) {
            const finalProgram = updateData.program || currentTask.program;
            const finalWeek = updateData.week || currentTask.week;
            
            const existingTask = await ProgramTask.findOne({ 
                _id: { $ne: id }, // Skip self
                program: finalProgram, 
                week: finalWeek,
                isActive: true 
            }).setOptions({ skipIsActiveFilter: true });
            
            if (existingTask) {
                throw new AppError(`An active task for week ${finalWeek} already exists for this program.`, 400);
            }
        }
    }

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
    // Perform a hard delete as requested to completely remove from database/indexing
    const programTask = await ProgramTask.findByIdAndDelete(id);

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
    // Find the highest week number among current tasks
    const lastTask = await ProgramTask.findOne({ program: programId })
        .sort({ week: -1 })
        .select('week');

    const nextWeek = lastTask ? lastTask.week + 1 : 1;

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


