const cron = require('node-cron');
const TaskReview = require('../models/taskReview.model');
const whatsappService = require('./whatsapp.service');
const logger = require('../utils/logger');

/**
 * Service to handle scheduled tasks
 */
class CronService {
    /**
     * Initialize all cron jobs
     */
    init() {
        // Schedule everyday at 5:00 AM IST
        // '0 5 * * *' is 5:00 AM in server time
        // Since we are likely on IST (or want IST), we can specify timezone if node-cron supports it
        // Or calculate the offset. Usually node-cron uses system time.
        cron.schedule('0 5 * * *', () => {
            this.sendDailyReviewReminders();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        logger.info('Cron jobs initialized');
    }

    /**
     * Send reminders for reviews scheduled for today
     */
    async sendDailyReviewReminders() {
        try {
            logger.info('Starting daily review reminders cron job');

            const SystemConfig = require('../models/systemConfig.model');
            const config = await SystemConfig.getSettings();

            if (!config.receive_message_on_whatsapp_in_review_schedule) {
                logger.info('WhatsApp notifications are disabled in system configuration');
                return;
            }

            // Get start and end of today in IST
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            // Find all active, non-cancelled reviews for today
            const reviews = await TaskReview.find({
                scheduledDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                isCancelled: false,
                isReviewCompleted: false,
                isActive: true
            }).populate('student', 'name mobileNo email');

            if (reviews.length === 0) {
                logger.info('No reviews scheduled for today');
                return;
            }

            const todayFormatted = this._formatDate(now);

            for (const review of reviews) {
                const student = review.student;
                if (!student || !student.mobileNo) continue;

                const studentName = student.name || 'Student';

                // template provided by user:
                /*
                Hi               ,
                Meeting Link:  
                scheduled on 24th Jan 2025 
                Please join the meeting.
                Thank you.
                */

                const message = `Hi *${studentName}*,\nMeeting Link: \nscheduled on *${todayFormatted}*\nPlease join the meeting.\nThank you.`;

                await whatsappService.sendTextMessage(student.mobileNo, message);
                logger.info(`Daily reminder sent to ${studentName} (${student.mobileNo})`);
            }

            logger.info(`Finished daily review reminders. Sent ${reviews.length} messages.`);
        } catch (error) {
            logger.error('Error in daily review reminders cron job:', error.message);
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

        // Get ordinal suffix
        let suffix = 'th';
        if (day % 10 === 1 && day !== 11) suffix = 'st';
        else if (day % 10 === 2 && day !== 12) suffix = 'nd';
        else if (day % 10 === 3 && day !== 13) suffix = 'rd';

        return `${day}${suffix} ${monthNames[d.getMonth()]} ${year}`;
    }
}

module.exports = new CronService();
