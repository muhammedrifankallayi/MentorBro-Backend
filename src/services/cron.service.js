const TaskReview = require('../models/taskReview.model');
const whatsappService = require('./whatsapp.service');
const logger = require('../utils/logger');

/**
 * Service to handle scheduled tasks without external dependencies like node-cron
 */
class CronService {
    /**
     * Initialize the cron checker
     */
    init() {
        logger.info('Cron service initialized (Zero-dependency mode)');

        setInterval(() => {
            const now = new Date();
            // Convert to IST (UTC + 5:30) point in time representing IST components locally
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60000));

            const hours = istDate.getHours();
            const minutes = istDate.getMinutes();

            // 1. Daily Summary Reminder at 5:00 AM IST
            if (hours === 5 && minutes === 0) {
                this.sendDailyReviewReminders(istDate);
            }

            // 2. 30-Minute Upcoming Review Reminders (Checked every minute)
            this.send30MinReminders(istDate);

        }, 60000); // Check every 60 seconds
    }

    /**
     * Send reminders for reviews scheduled for today
     * @param {Date} currentIstDate - Current date/time in IST
     */
    async sendDailyReviewReminders(currentIstDate) {
        try {
            logger.info('Starting daily review reminders task');

            const SystemConfig = require('../models/systemConfig.model');
            const config = await SystemConfig.getSettings();

            if (!config.receive_message_on_whatsapp_in_review_schedule) {
                logger.info('WhatsApp notifications are disabled in system configuration');
                return;
            }

            // Get start and end of today in IST
            const startOfDay = new Date(currentIstDate.getFullYear(), currentIstDate.getMonth(), currentIstDate.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(currentIstDate.getFullYear(), currentIstDate.getMonth(), currentIstDate.getDate(), 23, 59, 59, 999);

            const reviews = await TaskReview.find({
                scheduledDate: { $gte: startOfDay, $lte: endOfDay },
                isCancelled: false,
                isReviewCompleted: false,
                isActive: true
            }).populate('student', 'name mobileNo email');

            if (reviews.length === 0) {
                logger.info('No reviews scheduled for today');
                return;
            }

            const todayFormatted = this._formatDate(currentIstDate);

            for (const review of reviews) {
                const student = review.student;
                const studentName = student?.name || 'Student';

                // Using a standardized notification format for the group
                const notificationData = {
                    studentName: studentName,
                    taskName: review.programTask?.name || 'Task Review',
                    time: review.confirmedTime || review.scheduledTime,
                    date: review.scheduledDate,
                    reviewerName: review.reviewer?.fullName || review.reviewer?.username || 'Unassigned'
                };

                // Send to Management Group instead of student number
                await whatsappService.sendNotification('120363417698652224@g.us', 'REVIEW_REMINDER', notificationData);
                logger.info(`Daily reminder for ${studentName} sent to group`);
            }

            logger.info(`Finished daily review reminders. Sent ${reviews.length} messages.`);
        } catch (error) {
            logger.error('Error in daily review reminders task:', error.message);
        }
    }

    /**
     * Send reminders 30 minutes before a review starts
     * @param {Date} currentIstDate - Current date/time in IST
     */
    async send30MinReminders(currentIstDate) {
        try {
            const SystemConfig = require('../models/systemConfig.model');
            const config = await SystemConfig.getSettings();

            if (!config.receive_message_on_whatsapp_in_review_schedule) return;

            // Get start and end of today in IST
            const startOfDay = new Date(currentIstDate.getFullYear(), currentIstDate.getMonth(), currentIstDate.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(currentIstDate.getFullYear(), currentIstDate.getMonth(), currentIstDate.getDate(), 23, 59, 59, 999);

            // Find reviews for today that haven't had a reminder sent
            const reviews = await TaskReview.find({
                scheduledDate: { $gte: startOfDay, $lte: endOfDay },
                isCancelled: false,
                isReviewCompleted: false,
                isActive: true,
                isReminderSent: { $ne: true }
            }).populate('student', 'name mobileNo email')
                .populate('programTask', 'name')
                .populate('reviewer', 'fullName username email');

            for (const review of reviews) {
                if (!review.scheduledTime) continue;

                // Parse time into a date object sharing the same timezone context as currentIstDate
                const scheduledTimeIst = this._parseTimeToDate(currentIstDate, review.scheduledTime);
                if (!scheduledTimeIst) continue;

                // Difference in minutes
                const diffMs = scheduledTimeIst - currentIstDate;
                const diffMins = Math.round(diffMs / 60000);

                // If scheduled in exactly 30 minutes (catch 29-31 range)
                if (diffMins >= 29 && diffMins <= 30) {
                    const student = review.student;
                    const notificationData = {
                        studentName: student?.name || 'Student',
                        studentUsername: student?.username,
                        studentEmail: student?.email,
                        reviewerName: review.reviewer?.fullName || review.reviewer?.username || review.reviewer?.email || 'Mentor',
                        taskName: review.programTask?.name || 'Task Review',
                        time: review.confirmedTime || review.scheduledTime,
                        date: review.scheduledDate
                    };

                    // Send to Management Group instead of student number
                    await whatsappService.sendNotification('120363417698652224@g.us', 'REVIEW_REMINDER', notificationData);

                    // Mark as sent
                    await TaskReview.findByIdAndUpdate(review._id, { isReminderSent: true });

                    logger.info(`30-min reminder for ${student?.name} sent to group`);
                }
            }
        } catch (error) {
            logger.error('Error in 30-min reminder task:', error.message);
        }
    }

    /**
     * Parse time string like "10:30 AM" into a Date object on the same day as referenceDate
     * @private
     */
    _parseTimeToDate(referenceDate, timeStr) {
        try {
            let hours = 0, minutes = 0;
            const timePattern = /(\d+):(\d+)\s*(AM|PM)?/i;
            const match = timeStr.match(timePattern);

            if (!match) return null;

            hours = parseInt(match[1]);
            minutes = parseInt(match[2]);
            const modifier = match[3] ? match[3].toUpperCase() : null;

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), hours, minutes, 0, 0);
        } catch (e) {
            return null;
        }
    }

    /**
     * Format date to "25th Jan 2025" style
     * @private
     */
    _formatDate(date) {
        const d = new Date(date);
        const day = d.getDate();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const year = d.getFullYear();

        let suffix = 'th';
        if (day % 10 === 1 && day !== 11) suffix = 'st';
        else if (day % 10 === 2 && day !== 12) suffix = 'nd';
        else if (day % 10 === 3 && day !== 13) suffix = 'rd';

        return `${day}${suffix} ${monthNames[d.getMonth()]} ${year}`;
    }
}

module.exports = new CronService();
