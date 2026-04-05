const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Subtask title is required'],
            maxlength: [300, 'Subtask title cannot exceed 300 characters'],
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { _id: true }
);

const employeeTaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
            trim: true,
        },
        description: {
            type: String,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
            default: '',
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'Assigned employee is required'],
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        deadline: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        subtasks: {
            type: [subtaskSchema],
            default: [],
        },
        notes: {
            type: String,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

employeeTaskSchema.index({ assignedTo: 1, status: 1 });
employeeTaskSchema.index({ deadline: 1 });
employeeTaskSchema.index({ createdAt: -1 });

const EmployeeTask = mongoose.model('EmployeeTask', employeeTaskSchema);

module.exports = EmployeeTask;
