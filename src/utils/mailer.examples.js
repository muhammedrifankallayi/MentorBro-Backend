/**
 * Example: How to integrate mailer in your controllers/services
 * This file demonstrates various use cases
 */

const { mailer, catchAsync, AppError } = require('../utils');

// ============================================
// Example 1: Send welcome email after user registration
// ============================================
const registerUser = catchAsync(async (req, res) => {
    const { email, username, password } = req.body;

    // Create user (your existing logic)
    const user = await User.create({ email, username, password });

    // Send welcome email (async, non-blocking)
    // Using .catch() to prevent email errors from breaking the registration flow
    mailer.sendWelcomeEmail(email, username)
        .catch(err => console.error('Welcome email failed:', err));

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user }
    });
});

// ============================================
// Example 2: Send password reset email
// ============================================
const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('No user found with this email', 404));
    }

    // Generate reset token (implement this in your User model)
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    try {
        // Send email
        await mailer.sendPasswordResetEmail(email, resetToken, resetURL);

        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        });
    } catch (error) {
        // If email fails, cleanup the reset token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Failed to send email. Please try again later.', 500));
    }
});

// ============================================
// Example 3: Send task assignment notification
// ============================================
const assignReviewer = catchAsync(async (req, res) => {
    const { reviewerId, taskId } = req.body;

    // Your existing logic
    const reviewer = await Reviewer.findById(reviewerId);
    const task = await Task.findById(taskId);

    // Assign task
    task.reviewer = reviewerId;
    await task.save();

    // Send notification email
    const subject = 'New Task Assigned';
    const message = `You have been assigned a new task: "${task.title}". Please check your dashboard to review the details.`;

    mailer.sendNotificationEmail(reviewer.email, subject, message)
        .catch(err => console.error('Notification email failed:', err));

    res.status(200).json({
        success: true,
        message: 'Reviewer assigned successfully',
        data: { task }
    });
});

// ============================================
// Example 4: Send custom email with attachments
// ============================================
const sendTaskReport = catchAsync(async (req, res) => {
    const { userId, reportPath } = req.body;

    const user = await User.findById(userId);

    // Send email with attachment
    await mailer.sendEmail({
        to: user.email,
        subject: 'Your Monthly Task Report',
        text: 'Please find attached your monthly task report.',
        html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Monthly Task Report</h2>
        <p>Dear ${user.username},</p>
        <p>Please find attached your monthly task report.</p>
        <p>Best regards,<br>MentorBro Team</p>
      </div>
    `,
        attachments: [
            {
                filename: 'monthly-report.pdf',
                path: reportPath
            }
        ]
    });

    res.status(200).json({
        success: true,
        message: 'Report sent successfully'
    });
});

// ============================================
// Example 5: Send batch emails
// ============================================
const notifyAllReviewers = catchAsync(async (req, res) => {
    const { message, subject } = req.body;

    // Get all reviewers
    const reviewers = await Reviewer.find({ isActive: true });

    // Send emails in parallel
    const emailPromises = reviewers.map(reviewer =>
        mailer.sendNotificationEmail(reviewer.email, subject, message)
            .catch(err => {
                console.error(`Failed to send email to ${reviewer.email}:`, err);
                return { email: reviewer.email, success: false };
            })
    );

    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.status(200).json({
        success: true,
        message: 'Batch emails sent',
        data: {
            total: reviewers.length,
            successful,
            failed
        }
    });
});

// ============================================
// Example 6: Email verification flow
// ============================================
const sendEmailVerification = catchAsync(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    if (user.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email already verified'
        });
    }

    // Generate verification token (implement this in your User model)
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Send verification email
    await mailer.sendVerificationEmail(user.email, verificationToken, verificationURL);

    res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
    });
});

// ============================================
// Example 7: Handle email verification
// ============================================
const verifyEmail = catchAsync(async (req, res, next) => {
    const { token } = req.params;

    // Hash token and find user (implement hashing logic)
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Invalid or expired verification token', 400));
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Email verified successfully'
    });
});

module.exports = {
    registerUser,
    forgotPassword,
    assignReviewer,
    sendTaskReport,
    notifyAllReviewers,
    sendEmailVerification,
    verifyEmail
};
