const mongoose = require('mongoose');

const taskReviewSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Please provide student'],
        },
        program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Program',
        },
        programTask: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProgramTask',
        },
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reviewer',
        },
        scoreInTheory: {
            type: Number,
            min: [0, 'Score cannot be negative'],
            max: [100, 'Score cannot exceed 100'],
        },
        scoreInPractical: {
            type: Number,
            min: [0, 'Score cannot be negative'],
            max: [100, 'Score cannot exceed 100'],
        },
        practicalImprovement: {
            type: String,
            trim: true,
        },
        theoryImprovement: {
            type: String,
            trim: true,
        },
        scheduledDate: {
            type: Date,
            required: [true, 'Please provide scheduled date'],
        },
        scheduledTime: {
            type: String,
            required: [true, 'Please provide scheduled time'],
            trim: true,
        },
        endDate: {
            type: Date,
        },
        endTime: {
            type: String,
            trim: true,
        },
        isReviewCompleted: {
            type: Boolean,
            default: false,
        },
        isReReview: {
            type: Boolean,
            default: false,
        },
        reviewStatus: {
            type: String,
            enum: ['very_good', 'good', 'need_improvements', 'failed'],
        },
        isCancelled: {
            type: Boolean,
            default: false,
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
taskReviewSchema.index({ student: 1 });
taskReviewSchema.index({ reviewer: 1 });
taskReviewSchema.index({ program: 1 });
taskReviewSchema.index({ scheduledDate: 1 });

// Only return active task reviews in queries
taskReviewSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

const TaskReview = mongoose.model('TaskReview', taskReviewSchema);

module.exports = TaskReview;
