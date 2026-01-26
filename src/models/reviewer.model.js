const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config');

const reviewerSchema = new mongoose.Schema(
    {

        fullName: {
            type: String,
            trim: true,
            maxlength: [50, 'FullName cannot be more than 50 characters'],
        },
        username: {
            type: String,
            required: [true, 'Please provide a username'],
            unique: true,
            trim: true,
            maxlength: [50, 'Username cannot be more than 50 characters'],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't include password in queries by default
        },
        mobileNo: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null values
            trim: true,
            match: [/^\d{10}$/, 'Please provide a valid 10-digit mobile number'],
        },
        email: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null values
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        address: {
            type: String,
            trim: true,
            maxlength: [200, 'Address cannot be more than 200 characters'],
        },
        teachingPrograms: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Program',
        }],
        totalExperience: {
            type: Number,
            min: [0, 'Total experience cannot be negative'],
            max: [50, 'Total experience cannot exceed 50 years'],
            default: 0,
        },
        currentCompany: {
            type: String,
            trim: true,
            maxlength: [100, 'Company name cannot be more than 100 characters'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
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
reviewerSchema.index({ username: 1 });
reviewerSchema.index({ mobileNo: 1 });
reviewerSchema.index({ email: 1 });

// Set fullName to username if not provided
reviewerSchema.pre('save', function (next) {
    if (!this.fullName && this.username) {
        this.fullName = this.username;
    }
    next();
});

// Hash password before saving
reviewerSchema.pre('save', async function (next) {
    // Only run if password was modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, config.password.saltRounds);
    next();
});

// Update passwordChangedAt when password is modified
reviewerSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    // Subtract 1 second to ensure token is created after password change
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Only return active reviewers in queries
reviewerSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

/**
 * Compare provided password with stored hashed password
 */
reviewerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after token was issued
 */
reviewerSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
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
reviewerSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token expires in 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const Reviewer = mongoose.model('Reviewer', reviewerSchema);

module.exports = Reviewer;

