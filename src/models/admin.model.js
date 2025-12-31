const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const adminSchema = new mongoose.Schema(
    {
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
        isActive: {
            type: Boolean,
            default: true,
            select: false,
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
adminSchema.index({ username: 1 });

// Hash password before saving
adminSchema.pre('save', async function (next) {
    // Only run if password was modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, config.password.saltRounds);
    next();
});

// Update passwordChangedAt when password is modified
adminSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    // Subtract 1 second to ensure token is created after password change
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Only return active admins in queries
adminSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

/**
 * Compare provided password with stored hashed password
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after token was issued
 */
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
