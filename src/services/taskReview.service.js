const mongoose = require('mongoose');
const TaskReview = require('../models/taskReview.model');
const ProgramTask = require('../models/programTask.model');
const Student = require('../models/student.model');
const { AppError } = require('../utils');

/**
 * Create a new task review
 * @param {Object} reviewData - Task review data
 * @returns {Promise<Object>} Created task review
 */
const create = async (reviewData) => {
    // Check if a TaskReview already exists for the same student and programTask
    if (reviewData.student && reviewData.programTask) {
        const existingReview = await TaskReview.findOne({
            student: reviewData.student,
            programTask: reviewData.programTask,
            isCancelled: { $in: [false, null, undefined] },
        });

        // If exists and previous review status is not 'failed', don't allow creation
        if (existingReview && existingReview.reviewStatus !== 'failed') {
            throw new AppError('A task review already exists for this program task. New review is only allowed if previous review status is failed.', 400);
        }
    }

    // Fetch program task cost and set as paymentAmount or fineAmount
    if (reviewData.programTask) {
        const programTask = await ProgramTask.findById(reviewData.programTask);
        if (programTask) {
            if (reviewData.isReReview) {
                const fineAmount = (programTask.re_review_fine_amount && programTask.re_review_fine_amount > 0)
                    ? programTask.re_review_fine_amount
                    : 100;
                reviewData.re_reviewDetails = {
                    ...reviewData.re_reviewDetails,
                    fineAmount: fineAmount
                };
                // Set paymentAmount to fineAmount for re-reviews so it shows correctly in UI
                reviewData.paymentAmount = programTask.cost || 120;
                // If proof is provided, mark payment as ordered
            } else {
                reviewData.paymentAmount = programTask.cost || 0;
            }
        }
    }

    const taskReview = await TaskReview.create(reviewData);

    // Fetch the created document with populated fields
    const populatedReview = await TaskReview.findById(taskReview._id)
        .populate({
            path: 'student',
            select: 'name email batch mobileNo',
            populate: {
                path: 'batch',
                select: 'name',
            },
        })
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week re_review_fine_amount')
        .populate('reviewer', 'username fullName');

    // Send WhatsApp notification if enabled
    try {
        const SystemConfig = require('../models/systemConfig.model');
        const whatsappService = require('./whatsapp.service');

        const config = await SystemConfig.getSettings();

        if (config.receive_message_on_whatsapp_in_review_schedule && populatedReview.student?.mobileNo) {
            const formattedDate = new Date(populatedReview.scheduledDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            await whatsappService.sendNotification(
                populatedReview.student.mobileNo,
                'REVIEW_SCHEDULED',
                {
                    studentName: populatedReview.student.name,
                    taskName: populatedReview.programTask?.name || 'Task Review',
                    date: formattedDate,
                    time: populatedReview.scheduledTime
                }
            );
        }
    } catch (whatsappError) {
        // Log but don't fail the operation if WhatsApp fails
        console.error('Failed to send WhatsApp notification:', whatsappError.message);
    }

    return populatedReview;
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
        isPaymentOrderd,
        isPaymentCompleted,
        isReReview,
        scheduledDateFrom,
        scheduledDateTo,
        endDateFrom,
        endDateTo,
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
    if (isPaymentOrderd !== undefined) filter.isPaymentOrderd = isPaymentOrderd === 'true';
    if (isPaymentCompleted !== undefined) filter.isPaymentCompleted = isPaymentCompleted === 'true';
    if (isReReview !== undefined) filter.isReReview = isReReview === 'true';
    if (queryParams.isCancelled !== undefined) {
        filter.isCancelled = queryParams.isCancelled === 'true' || queryParams.isCancelled === true;
    }

    // Scheduled Date Range Filter
    if (scheduledDateFrom || scheduledDateTo) {
        filter.scheduledDate = {};
        if (scheduledDateFrom) {
            // Treat string as start of day in IST
            const dateStr = scheduledDateFrom.includes('T') ? scheduledDateFrom.split('T')[0] : scheduledDateFrom;
            filter.scheduledDate.$gte = new Date(`${dateStr}T00:00:00+05:30`);
        }
        if (scheduledDateTo) {
            // Treat string as end of day in IST
            const dateStr = scheduledDateTo.includes('T') ? scheduledDateTo.split('T')[0] : scheduledDateTo;
            filter.scheduledDate.$lte = new Date(`${dateStr}T23:59:59.999+05:30`);
        }
    }

    // End Date Range Filter
    if (endDateFrom || endDateTo) {
        filter.endDate = {};
        if (endDateFrom) {
            const dateStr = endDateFrom.includes('T') ? endDateFrom.split('T')[0] : endDateFrom;
            filter.endDate.$gte = new Date(`${dateStr}T00:00:00+05:30`);
        }
        if (endDateTo) {
            const dateStr = endDateTo.includes('T') ? endDateTo.split('T')[0] : endDateTo;
            filter.endDate.$lte = new Date(`${dateStr}T23:59:59.999+05:30`);
        }
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [taskReviews, total] = await Promise.all([
        TaskReview.find(filter)
            .populate({
                path: 'student',
                select: 'name email batch',
                populate: {
                    path: 'batch',
                    select: 'name',
                },
            })
            .populate('program', 'name totalWeeks')
            .populate('programTask', 'name week re_review_fine_amount')
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
        .populate({
            path: 'student',
            select: 'name email batch',
            populate: {
                path: 'batch',
                select: 'name',
            },
        })
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week tasks re_review_fine_amount')
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
            .populate({
                path: 'student',
                select: 'name email batch',
                populate: {
                    path: 'batch',
                    select: 'name',
                },
            })
            .populate('program', 'name totalWeeks')
            .populate('programTask', 'name week re_review_fine_amount')
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
            .populate({
                path: 'student',
                select: 'name email batch',
                populate: {
                    path: 'batch',
                    select: 'name',
                },
            })
            .populate('program', 'name totalWeeks')
            .populate('programTask', 'name week re_review_fine_amount')
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
    // If programTask, isReReview, or re_reviewDetails is being updated, we need to potentially recalculate costs
    if (updateData.programTask || updateData.isReReview !== undefined || updateData.re_reviewDetails) {
        const currentReview = await TaskReview.findById(id);
        if (!currentReview) {
            throw new AppError('Task review not found', 404);
        }

        const programTaskId = updateData.programTask || currentReview.programTask;
        const isReReview = updateData.isReReview !== undefined ? updateData.isReReview : currentReview.isReReview;

        if (programTaskId) {
            const programTask = await ProgramTask.findById(programTaskId);
            if (programTask) {
                if (isReReview) {
                    const fineAmount = (programTask.re_review_fine_amount && programTask.re_review_fine_amount > 0)
                        ? programTask.re_review_fine_amount
                        : 100;

                    // Update re_reviewDetails while maintaining existing data
                    updateData.re_reviewDetails = {
                        ...(currentReview.re_reviewDetails ? currentReview.re_reviewDetails.toObject() : {}),
                        ...updateData.re_reviewDetails,
                        fineAmount: fineAmount
                    };

                    // Set paymentAmount to fineAmount for re-reviews so it shows correctly in UI
                    updateData.paymentAmount = fineAmount;
                    // If proof is provided or already exists, mark payment as ordered
                    if (updateData.re_reviewDetails?.proof || (currentReview.re_reviewDetails && currentReview.re_reviewDetails.proof)) {
                        updateData.isPaymentOrderd = true;
                    }
                } else {
                    updateData.paymentAmount = programTask.cost || 0;
                    // Clear re_reviewDetails if it's no longer a re-review
                    updateData.re_reviewDetails = {
                        fineAmount: 0,
                        paymentDate: null,
                        proof: null
                    };
                }
            }
        }
    }

    // If reviewer is being unassigned, clear confirmedTime
    if (updateData.reviewer === null) {
        updateData.confirmedTime = "";
    }

    const taskReview = await TaskReview.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    )
        .populate({
            path: 'student',
            select: 'name email batch',
            populate: {
                path: 'batch',
                select: 'name',
            },
        })
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week re_review_fine_amount')
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
 * @param {string} cancellationReason - Reason for cancellation
 * @returns {Promise<Object>} Cancelled task review
 */
const cancel = async (id, cancellationReason) => {
    const updateData = { isCancelled: true };
    if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
    }

    const taskReview = await TaskReview.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    )
        .populate({
            path: 'student',
            select: 'name email batch',
            populate: {
                path: 'batch',
                select: 'name',
            },
        })
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week re_review_fine_amount')
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
        .populate({
            path: 'student',
            select: 'name email batch',
            populate: {
                path: 'batch',
                select: 'name',
            },
        })
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week re_review_fine_amount')
        .populate('reviewer', 'fullName username email mobileNo');

    // Send email notification to student if enabled
    try {
        const SystemConfig = require('../models/systemConfig.model');
        const mailerService = require('./mailer.service');

        const config = await SystemConfig.getSettings();

        if (config.send_mail_on_reviewer_assign_to_student && updatedTaskReview.student?.email) {
            await mailerService.sendReviewerAssignedEmail(
                { email: updatedTaskReview.student.email, name: updatedTaskReview.student.name },
                { fullName: updatedTaskReview.reviewer?.fullName, username: updatedTaskReview.reviewer?.username },
                {
                    scheduledDate: updatedTaskReview.scheduledDate,
                    scheduledTime: updatedTaskReview.scheduledTime,
                    programTask: updatedTaskReview.programTask
                }
            );
        }
    } catch (emailError) {
        // Log but don't fail the operation if email fails
        console.error('Failed to send reviewer assigned email:', emailError.message);
    }

    return updatedTaskReview;
};

/**
 * Unassign reviewer from a task review
 * @param {string} id - Task review ID
 * @returns {Promise<Object>} Updated task review
 */
const unassignReviewer = async (id) => {
    // First check if task review exists
    const taskReview = await TaskReview.findById(id);

    if (!taskReview) {
        throw new AppError('Task review not found', 404);
    }

    // Check if task review is already cancelled
    if (taskReview.isCancelled) {
        throw new AppError('Cannot unassign reviewer from a cancelled task review', 400);
    }

    // Check if task review is already completed
    if (taskReview.isReviewCompleted) {
        throw new AppError('Cannot unassign reviewer from a completed task review', 400);
    }

    // Update the reviewer to null
    const updatedTaskReview = await TaskReview.findByIdAndUpdate(
        id,
        { reviewer: null, confirmedTime: "" },
        {
            new: true,
            runValidators: true,
        }
    )
        .populate({
            path: 'student',
            select: 'name email batch',
            populate: {
                path: 'batch',
                select: 'name',
            },
        })
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week re_review_fine_amount')
        .populate('reviewer', 'fullName username email mobileNo');

    return updatedTaskReview;
};

/**
 * Get next week program task for a student based on their last completed review
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Next program task or current if re-review needed
 */
const getNextWeekForStudent = async (studentId) => {
    // Find last completed review by endDate (exclude null/undefined endDate)
    const lastReview = await TaskReview.findOne({
        student: studentId,
        isReviewCompleted: true,
        isCancelled: { $in: [false, null, undefined] },
        endDate: { $ne: null, $exists: true },
    })
        .sort({ endDate: -1 })
        .populate('programTask', 'week')
        .populate('program', '_id name totalWeeks');
    console.log(lastReview);

    // No review found → get student's program and return week 1 task
    if (!lastReview || !lastReview.programTask) {
        const student = await Student.findById(studentId).select('program');

        if (!student || !student.program) {
            throw new AppError('Student or program not found', 404);
        }

        const firstTask = await ProgramTask.findOne({
            program: student.program,
            week: 1,
        }).populate('program', 'name totalWeeks');

        return firstTask;
    }

    const programId = lastReview.program._id;
    const currentWeek = lastReview.programTask.week;

    // If status is 'failed' → same week (re-review), else → week + 1
    const targetWeek = lastReview.reviewStatus === 'failed' ? currentWeek : currentWeek + 1;

    const nextTask = await ProgramTask.findOne({
        program: programId,
        week: targetWeek,
    }).populate('program', 'name totalWeeks');

    return nextTask;
};

/**
 * Bulk update multiple task reviews
 * @param {Array} updates - Array of objects with { id, updateData }
 * @returns {Promise<Object>} Results with updated count and any errors
 */
const bulkUpdate = async (updates) => {
    if (!Array.isArray(updates) || updates.length === 0) {
        throw new AppError('Updates must be a non-empty array', 400);
    }

    const results = {
        success: [],
        failed: [],
    };

    for (const item of updates) {
        try {
            const { _id, ...updateData } = item;

            if (!_id) {
                results.failed.push({ id: null, error: 'ID is required' });
                continue;
            }

            const taskReview = await TaskReview.findByIdAndUpdate(
                _id,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            );

            if (!taskReview) {
                results.failed.push({ _id, error: 'Task review not found' });
            } else {
                results.success.push({ _id, updated: true });
            }
        } catch (error) {
            results.failed.push({ _id: item._id, error: error.message });
        }
    }

    return {
        totalProcessed: updates.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        success: results.success,
        failed: results.failed,
    };
};

/**
 * Get the last (most recent) task review for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Last task review
 */
const getLastReviewForStudent = async (studentId) => {
    const taskReview = await TaskReview.findOne({
        student: studentId,
        isReviewCompleted: true
    })
        .sort({ scheduledDate: -1, createdAt: -1 })
        .populate({
            path: 'student',
            select: 'name email batch',
            populate: {
                path: 'batch',
                select: 'name',
            },
        })
        .populate('program', 'name totalWeeks')
        .populate('programTask', 'name week re_review_fine_amount')
        .populate('reviewer', 'username fullName');

    if (!taskReview) {
        throw new AppError('No reviews found for this student', 404);
    }

    return taskReview;
};

/**
 * Get reviewer earnings for dashboard graph
 * Supports weekly, monthly, yearly, and today period types
 * @param {string} reviewerId - Reviewer ID
 * @param {Object} queryParams - Query parameters including period type
 * @returns {Promise<Object>} Earnings data grouped by date
 */
const getReviewerEarnings = async (reviewerId, queryParams = {}) => {
    const { period = 'weekly' } = queryParams;

    // Calculate date range based on period type
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case 'weekly':
            // Get the start of the current week (Sunday)
            const dayOfWeek = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'monthly':
            // Get the start of the current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            // Get the end of the current month
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'yearly':
            // Get the start of the current year
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            // Get the end of the current year
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        default:
            // Default to weekly
            const defaultDayOfWeek = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - defaultDayOfWeek);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
    }

    // MongoDB aggregation to group earnings by date
    const earningsData = await TaskReview.aggregate([
        {
            $match: {
                reviewer: new mongoose.Types.ObjectId(reviewerId),
                isPaymentCompleted: true,
                isActive: { $ne: false },
                endDate: {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$endDate' },
                },
                totalAmount: { $sum: '$paymentAmount' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                totalAmount: 1,
                count: 1,
            },
        },
        {
            $sort: { date: 1 },
        },
    ]);

    // Calculate total earnings for the period
    const totalEarnings = earningsData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalReviews = earningsData.reduce((sum, item) => sum + item.count, 0);

    // Generate dates array for the selected period (to fill in days with 0 earnings)
    const allDates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const existingData = earningsData.find((item) => item.date === dateStr);
        allDates.push({
            date: dateStr,
            totalAmount: existingData ? existingData.totalAmount : 0,
            count: existingData ? existingData.count : 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalEarnings,
        totalReviews,
        dailyEarnings: allDates,
    };
};

/**
 * Get admin stats (pending payments, completed reviews, unassigned reviews)
 * Uses aggregation facet for single-pass efficiency
 * @param {Object} queryParams - Query parameters (fromDate, toDate)
 * @returns {Promise<Object>} Stats object
 */
const getAdminStats = async (queryParams = {}) => {
    const { fromDate, toDate } = queryParams;

    // Build Match Stage for Date Filtering
    const matchStage = {
        isActive: { $ne: false }, // Always exclude deleted
    };

    if (fromDate || toDate) {
        matchStage.scheduledDate = {};
        if (fromDate) {
            matchStage.scheduledDate.$gte = new Date(fromDate);
        }
        if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            matchStage.scheduledDate.$lte = end;
        }
    }

    const stats = await TaskReview.aggregate([
        { $match: matchStage },
        {
            $facet: {
                // 1. Total Pending Payment (Review Completed but Payment Not Completed)
                pendingPayments: [
                    {
                        $match: {
                            isReviewCompleted: true,
                            isPaymentCompleted: false,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$paymentAmount' },
                            count: { $sum: 1 },
                        },
                    },
                ],
                // 2. Total Reviews Completed
                completedReviews: [
                    {
                        $match: {
                            isReviewCompleted: true,
                        },
                    },
                    {
                        $count: 'count',
                    },
                ],
                // 3. Total Unassigned Reviews
                unassignedReviews: [
                    {
                        $match: {
                            $or: [{ reviewer: null }, { reviewer: { $exists: false } }],
                        },
                    },
                    {
                        $count: 'count',
                    },
                ],
            },
        },
    ]);

    // Extract results from facets (arrays)
    const result = stats[0];

    return {
        pendingPayment: {
            amount: result.pendingPayments[0] ? result.pendingPayments[0].totalAmount : 0,
            count: result.pendingPayments[0] ? result.pendingPayments[0].count : 0,
        },
        totalCompletedReviews: result.completedReviews[0] ? result.completedReviews[0].count : 0,
        totalUnassignedReviews: result.unassignedReviews[0] ? result.unassignedReviews[0].count : 0,
        dateRange: {
            from: fromDate || null,
            to: toDate || null,
        },
    };
};

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
