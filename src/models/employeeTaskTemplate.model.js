const mongoose = require('mongoose');

const templateSubtaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Subtask title is required'],
            maxlength: [300, 'Subtask title cannot exceed 300 characters'],
            trim: true,
        },
    },
    { _id: true }
);

const employeeTaskTemplateSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Template title is required'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
            trim: true,
        },
        description: {
            type: String,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
            default: '',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        subtasks: {
            type: [templateSubtaskSchema],
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

employeeTaskTemplateSchema.index({ title: 'text' });
employeeTaskTemplateSchema.index({ createdAt: -1 });

const EmployeeTaskTemplate = mongoose.model('EmployeeTaskTemplate', employeeTaskTemplateSchema);

module.exports = EmployeeTaskTemplate;
