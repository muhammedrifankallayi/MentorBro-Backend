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

/**
 * Get monthly attendance calendar for a specific employee (admin view)
 */
const getCalendarForAdmin = async (employeeId, year, month) => {
    if (!employeeId) throw new AppError('employeeId is required', 400);

    const y = Number(year);
    const m = Number(month); // 1-indexed

    const startOfMonth = new Date(Date.UTC(y, m - 1, 1));
    const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const records = await Attendance.find({
        employee: employeeId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 });

    // Map: 'YYYY-MM-DD' -> record
    const recordMap = {};
    records.forEach((r) => {
        const key = r.date.toISOString().split('T')[0];
        recordMap[key] = r;
    });

    const todayUTC = new Date();
    const todayStr = `${todayUTC.getUTCFullYear()}-${String(todayUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(todayUTC.getUTCDate()).padStart(2, '0')}`;

    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const record = recordMap[dateStr];

        let status;
        if (dateStr > todayStr) {
            status = 'future';
        } else if (!record || !record.checkIn) {
            status = 'absent';
        } else if (record.checkIn && record.checkOut) {
            status = 'present';
        } else {
            status = 'not_checked_out';
        }

        days.push({
            date: dateStr,
            day: d,
            weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), // 0=Sun, 6=Sat
            status,
            checkIn: record?.checkIn || null,
            checkOut: record?.checkOut || null,
            totalWorkedMinutes: record?.totalWorkedMinutes || 0,
        });
    }

    return days;
};

/**
 * Get monthly attendance report for ALL approved employees (admin view)
 * Returns each employee with day-by-day status codes and totals.
 *
 * Status codes:
 *   Y = present (checked in + out)
 *   P = partial (checked in, no checkout)
 *   N = absent / no-show
 *   H = weekend (non-working)
 *   F = future date
 */
const getMonthlyReportForAdmin = async (year, month) => {
    const y = Number(year);
    const m = Number(month); // 1-indexed

    const startOfMonth = new Date(Date.UTC(y, m - 1, 1));
    const endOfMonth   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    const daysInMonth  = new Date(Date.UTC(y, m, 0)).getUTCDate();

    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    // Fetch all approved employees (active only, enforced by pre-find hook)
    const employees = await Employee.find({ approvalStatus: 'approved' })
        .select('name email')
        .lean();

    // Fetch all attendance records for the month in one query
    const records = await Attendance.find({
        date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();

    // Build lookup: employeeId -> { 'YYYY-MM-DD': record }
    const recordMap = {};
    records.forEach((r) => {
        const empId = r.employee.toString();
        if (!recordMap[empId]) recordMap[empId] = {};
        const key = r.date.toISOString().split('T')[0];
        recordMap[empId][key] = r;
    });

    const result = employees.map((emp) => {
        const empRecords = recordMap[emp._id.toString()] || {};
        const days = [];
        const totals = { Y: 0, P: 0, N: 0, H: 0, F: 0 };
        let workdaysSoFar = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
            const isWeekend = weekday === 0 || weekday === 6;
            const isFuture  = dateStr > todayStr;

            let status;
            if (isWeekend) {
                status = 'H';
                totals.H++;
            } else if (isFuture) {
                status = 'F';
                totals.F++;
            } else {
                workdaysSoFar++;
                const rec = empRecords[dateStr];
                if (rec?.checkIn && rec?.checkOut) {
                    status = 'Y'; totals.Y++;
                } else if (rec?.checkIn) {
                    status = 'P'; totals.P++;
                } else {
                    status = 'N'; totals.N++;
                }
            }

            days.push({ day: d, weekday, status });
        }

        const attendancePct = workdaysSoFar > 0
            ? Math.round((totals.Y / workdaysSoFar) * 100)
            : 0;

        return {
            _id:  emp._id,
            name: emp.name,
            email: emp.email,
            days,
            totals: { ...totals, attendancePct },
        };
    });

    return { year: y, month: m, daysInMonth, employees: result };
};

module.exports = { checkIn, checkOut, getToday, getAllForAdmin, getCalendarForAdmin, getMonthlyReportForAdmin };
