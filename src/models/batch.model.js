const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide batch name'],
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters'],
        },
        startOn: {
            type: Date,
        },
        endedOn: {
            type: Date,
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
batchSchema.index({ name: 1 });

// Only return active batches in queries
batchSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;