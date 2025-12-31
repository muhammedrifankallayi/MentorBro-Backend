const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide program name'],
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters'],
        },
        totalWeeks: {
            type: Number,
            min: [1, 'Total weeks must be at least 1'],
        },
        topics: {
            type: [String],
            default: [],
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

// Index for faster queries
programSchema.index({ name: 1 });

// Only return active programs in queries
programSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

const Program = mongoose.model('Program', programSchema);

module.exports = Program;
