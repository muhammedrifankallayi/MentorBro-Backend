const Attendance = require('../models/attendance.model');
const Employee = require('../models/employee.model');
const { AppError } = require('../utils');

/**
 * Returns the UTC midnight Date for today (used as the "date" key per record)
 */
const getTodayStart = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Check in for today
 */
const checkIn = async (employeeId) => {
    const todayStart = getTodayStart();

    let record = await Attendance.findOne({ employee: employeeId, date: todayStart });

    if (record && record.checkIn) {
        throw new AppError('You have already checked in today', 400);
    }

    if (!record) {
        record = await Attendance.create({
            employee: employeeId,
            date: todayStart,
            checkIn: new Date(),
        });
    } else {
        record.checkIn = new Date();
        await record.save();
    }

    return record;
};

/**
 * Check out for today
 */
const checkOut = async (employeeId) => {
    const todayStart = getTodayStart();

    const record = await Attendance.findOne({ employee: employeeId, date: todayStart });

    if (!record || !record.checkIn) {
        throw new AppError('You have not checked in today', 400);
    }

    if (record.checkOut) {
        throw new AppError('You have already checked out today', 400);
    }

    record.checkOut = new Date();
    record.totalWorkedMinutes = Math.round((record.checkOut - record.checkIn) / 60000);
    await record.save();

    return record;
};

/**
 * Get today's attendance record for an employee (null if none)
 */
const getToday = async (employeeId) => {
    const todayStart = getTodayStart();
    const record = await Attendance.findOne({ employee: employeeId, date: todayStart });
    return record || null;
};

/**
 * Get all attendance records for admin with optional filtering and pagination
 */
const getAllForAdmin = async ({ page = 1, limit = 20, search = '', startDate, endDate, employeeId } = {}) => {
    const query = {};

    // Filter by specific employee
    if (employeeId) {
        query.employee = employeeId;
    }

    // Filter by search (look up matching employee IDs first)
    if (search && search.trim()) {
        const matchingEmployees = await Employee.find({
            $or: [
                { name: { $regex: search.trim(), $options: 'i' } },
                { email: { $regex: search.trim(), $options: 'i' } },
            ],
        }).select('_id');
        query.employee = { $in: matchingEmployees.map((e) => e._id) };
    }

    // Filter by date range
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            query.date.$lte = end;
        }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
        Attendance.find(query)
            .populate({ path: 'employee', select: 'name email' })
            .sort({ date: -1, checkIn: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Attendance.countDocuments(query),
    ]);

    return {
        data,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
    };
};

module.exports = { checkIn, checkOut, getToday, getAllForAdmin };
