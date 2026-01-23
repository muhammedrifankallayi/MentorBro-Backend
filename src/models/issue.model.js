const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Please provide student'],
        },
        title: {
            type: String,
            required: [true, 'Please provide issue title'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Please provide issue description'],
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        screenshot: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'considered', 'fixed'],
            default: 'pending',
        },
        adminComment: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for faster queries
issueSchema.index({ student: 1 });
issueSchema.index({ status: 1 });
issueSchema.index({ createdAt: -1 });

// Only return active issues in queries
issueSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
