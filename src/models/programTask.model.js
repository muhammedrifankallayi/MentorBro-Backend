const mongoose = require('mongoose');

const programTaskSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide task name'],
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters'],
        },
        week: {
            type: Number,
            required: [true, 'Please provide week number'],
            min: [1, 'Week must be at least 1'],
        },
        program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Program',
            required: [true, 'Please provide program'],
        },
        tasks: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        cost: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster queries and ensuring unique rounds per active program
programTaskSchema.index({ program: 1, week: 1, isActive: 1 }, {
    unique: true,
    partialFilterExpression: { isActive: true }
});
programTaskSchema.index({ program: 1 });
programTaskSchema.index({ week: 1 });

// Only return active program tasks in queries unless explicitly specified
programTaskSchema.pre(/^find/, function (next) {
    if (this.getOptions().skipIsActiveFilter) {
        return next();
    }
    this.find({ isActive: { $ne: false } });
    next();
});

const ProgramTask = mongoose.model('ProgramTask', programTaskSchema);

module.exports = ProgramTask;
