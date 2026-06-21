const express = require('express');
const adminController = require('../../controllers/admin');
const issueAdminController = require('../../controllers/issue/issue.admin.controller');
const systemConfigRoutes = require('./systemConfig.routes');
const mailRoutes = require('./mail.routes');
const commonCertificateRoutes = require('./commonCertificate.routes');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const Employee = require('../../models/employee.model');
const { catchAsync, ApiResponse } = require('../../utils');
const attendanceService = require('../../services/attendance.service');
const employeeTaskService = require('../../services/employeeTask.service');
const employeeTaskTemplateService = require('../../services/employeeTaskTemplate.service');

const router = express.Router();

// Public routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// Protected routes - Admin only
router.use(protect);
router.use(restrictTo('admin'));

router.post('/logout', adminController.logout);
router.get('/me', adminController.getMe);
router.patch('/update-password', adminController.updatePassword);

// System Configuration routes
router.use('/config', systemConfigRoutes);

// Mail routes
router.use('/mail', mailRoutes);

// Student management routes
router.get('/students/review-status', adminController.getStudentsReviewStatus);
router.get('/students/status/:status', adminController.getStudentsByApprovalStatus);
router.get('/students/batch/:batchId', adminController.getStudentsByBatch);
router.patch('/students/:id/approval', adminController.updateStudentApproval);
router.patch('/students/:id/block', adminController.updateStudentBlock);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/:id/impersonate', adminController.impersonateStudent);

// Issue management routes
router.get('/issues/stats', issueAdminController.getIssueStats);
router.get('/issues', issueAdminController.getAllIssues);
router.get('/issues/:id', issueAdminController.getIssueById);
router.patch('/issues/:id/status', issueAdminController.updateIssueStatus);
router.delete('/issues/:id', issueAdminController.deleteIssue);

// Common Certification Routes
router.use('/common-certificates', commonCertificateRoutes);

// Employee management routes
router.get('/employees', catchAsync(async (req, res) => {
    const { page = 1, limit = 20, search = '', status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }
    if (status) query.approvalStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
        Employee.find(query).sort(sort).skip(skip).limit(Number(limit)),
        Employee.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        message: 'Employees fetched successfully',
        data,
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
    });
}));

router.post('/employees', catchAsync(async (req, res) => {
    const { name, email, password, mobileNo, address, approvalStatus } = req.body;
    const employee = await Employee.create({ name, email, password, mobileNo, address, approvalStatus: approvalStatus || 'approved' });
    employee.password = undefined;
    ApiResponse.created(res, employee, 'Employee created successfully');
}));

router.patch('/employees/:id/approval', catchAsync(async (req, res) => {
    const { approvalStatus } = req.body;
    const employee = await Employee.findByIdAndUpdate(req.params.id, { approvalStatus }, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    ApiResponse.success(res, employee, 'Approval status updated');
}));

router.put('/employees/:id', catchAsync(async (req, res) => {
    const allowed = ['name', 'email', 'mobileNo', 'address', 'approvalStatus', 'isActive'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const employee = await Employee.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    ApiResponse.success(res, employee, 'Employee updated');
}));

// Attendance management routes
router.get('/attendance/monthly-report', catchAsync(async (req, res) => {
    const now = new Date();
    const y = req.query.year  ? Number(req.query.year)  : now.getUTCFullYear();
    const m = req.query.month ? Number(req.query.month) : now.getUTCMonth() + 1;
    const data = await attendanceService.getMonthlyReportForAdmin(y, m);
    res.status(200).json({ success: true, message: 'Monthly report fetched successfully', data });
}));

router.get('/attendance/calendar', catchAsync(async (req, res) => {
    const { employeeId, year, month } = req.query;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId is required' });
    const now = new Date();
    const y = year ? Number(year) : now.getUTCFullYear();
    const m = month ? Number(month) : now.getUTCMonth() + 1;
    const days = await attendanceService.getCalendarForAdmin(employeeId, y, m);
    res.status(200).json({ success: true, message: 'Calendar fetched successfully', data: days });
}));

router.get('/attendance', catchAsync(async (req, res) => {
    const { page = 1, limit = 20, search = '', startDate, endDate, employeeId } = req.query;
    const result = await attendanceService.getAllForAdmin({ page, limit, search, startDate, endDate, employeeId });
    ApiResponse.list(res, result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
    }, 'Attendance records fetched successfully');
}));

// Employee Task management routes
router.get('/employee-tasks', catchAsync(async (req, res) => {
    const { page = 1, limit = 20, search = '', status, priority, employeeId, date } = req.query;
    const result = await employeeTaskService.getAllForAdmin({ page, limit, search, status, priority, employeeId, date });
    ApiResponse.list(res, result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
    }, 'Tasks fetched successfully');
}));

router.post('/employee-tasks', catchAsync(async (req, res) => {
    const task = await employeeTaskService.createTask(req.body);
    ApiResponse.created(res, task, 'Task created successfully');
}));

router.get('/employee-tasks/:id', catchAsync(async (req, res) => {
    const task = await employeeTaskService.getById(req.params.id);
    ApiResponse.success(res, task, 'Task retrieved successfully');
}));

router.put('/employee-tasks/:id', catchAsync(async (req, res) => {
    const task = await employeeTaskService.updateTask(req.params.id, req.body);
    ApiResponse.success(res, task, 'Task updated successfully');
}));

router.delete('/employee-tasks/:id', catchAsync(async (req, res) => {
    await employeeTaskService.deleteTask(req.params.id);
    ApiResponse.success(res, null, 'Task deleted successfully');
}));

// Employee Task Template routes
router.get('/task-templates', catchAsync(async (req, res) => {
    const { page = 1, limit = 100, search = '' } = req.query;
    const result = await employeeTaskTemplateService.getAll({ page, limit, search });
    ApiResponse.list(res, result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
    }, 'Templates fetched successfully');
}));

router.post('/task-templates', catchAsync(async (req, res) => {
    const template = await employeeTaskTemplateService.create(req.body);
    ApiResponse.created(res, template, 'Template created successfully');
}));

router.put('/task-templates/:id', catchAsync(async (req, res) => {
    const template = await employeeTaskTemplateService.update(req.params.id, req.body);
    ApiResponse.success(res, template, 'Template updated successfully');
}));

router.delete('/task-templates/:id', catchAsync(async (req, res) => {
    await employeeTaskTemplateService.deleteTemplate(req.params.id);
    ApiResponse.success(res, null, 'Template deleted successfully');
}));

module.exports = router;


