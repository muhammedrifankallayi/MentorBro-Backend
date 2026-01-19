const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
            maxlength: [50, 'Name cannot be more than 50 characters'],
        },
        type: {
            type: String,
            enum: ['batch_student', 'external_student'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't include password in queries by default
        },
        mobileNo: {
            type: String,
            trim: true,
            match: [/^\d{10}$/, 'Please provide a valid 10-digit mobile number'],
        },
        address: {
            type: String,
            trim: true,
            maxlength: [200, 'Address cannot be more than 200 characters'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        batch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Batch',
        },
        program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Program',
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster queries
studentSchema.index({ email: 1 });
studentSchema.index({ type: 1 });

// Hash password before saving
studentSchema.pre('save', async function (next) {
    // Only run if password was modified
    if (!this.isModified('password')) return next();

    // Hash the password
    this.password = await bcrypt.hash(this.password, config.password.saltRounds);
    next();
});

// Update passwordChangedAt when password is modified
studentSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    // Subtract 1 second to ensure token is created after password change
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Only return active students in queries
studentSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

/**
 * Compare provided password with stored hashed password
 */
studentSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after token was issued
 */
studentSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

/**
 * Create password reset token
 */
studentSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token expires in 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
