const cron = require('node-cron');
const TaskReview = require('../models/taskReview.model');
const whatsappService = require('./whatsapp.service');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

/**
 * Service to handle scheduled tasks using node-cron
 */
class CronService {
    /**
     * Get current IST date by converting system local time 
     */
    getIstDate() {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60000));
    }

    /**
     * Initialize the cron checker
     */
    init() {
        logger.info('Cron service initialized (using node-cron)');

        // 1. Daily Summary Reminder at 5:00 AM IST
        cron.schedule('0 5 * * *', () => {
            const istDate = this.getIstDate();
            this.sendDailyReviewReminders(istDate);
        }, { timezone: 'Asia/Kolkata' });

        // 2. Daily Meeting Message at 7:00 AM IST
        cron.schedule('0 7 * * *', () => {
            const istDate = this.getIstDate();
            this.sendDailyMeetingMessage(istDate);
        }, { timezone: 'Asia/Kolkata' });

        // 3. 5-Minute Upcoming Review Reminders (Checked every minute)
        cron.schedule('* * * * *', () => {
            const istDate = this.getIstDate();
            this.send5MinReminders(istDate);
        }, { timezone: 'Asia/Kolkata' });

        // 4. 2-Minute FCM Push Notification to Students (Checked every minute)
        cron.schedule('* * * * *', () => {
            const istDate = this.getIstDate();
            this.send2MinStudentReminders(istDate);
        }, { timezone: 'Asia/Kolkata' });
    }

    /**
     * Send reminders for reviews scheduled for today
     * @param {Date} currentIstDate - Current date/time in IST
     */
    async sendDailyReviewReminders(currentIstDate) {
        try {
            logger.info('Starting daily review reminders task');

            const config = await SystemConfig.getSettings();

            if (!config.receive_message_on_whatsapp_in_review_schedule || !config.send_review_reminder_to_group) {
                logger.info('WhatsApp review reminders are disabled in system configuration');
                return;
            }

            const groupId = config.whapi?.groupId || '120363417698652224@g.us';

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

                // Send to dynamic Group ID
                await whatsappService.sendNotification(groupId, 'REVIEW_REMINDER', notificationData);
                logger.info(`Daily reminder for ${studentName} sent to group ${groupId}`);
            }

            logger.info(`Finished daily review reminders. Sent ${reviews.length} messages.`);
        } catch (error) {
            logger.error('Error in daily review reminders task:', error.message);
        }
    }

    /**
     * Send daily meeting message at 7 AM IST to WhatsApp group
     * @param {Date} currentIstDate - Current date/time in IST
     */
    async sendDailyMeetingMessage(currentIstDate) {
        try {
            logger.info('Starting daily meeting message task');

            const SystemConfig = require('../models/systemConfig.model');
            const config = await SystemConfig.getSettings();
            const groupId = config.whapi?.groupId || '120363417698652224@g.us';

            // Format date as "Feb 14 2026"
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const day = currentIstDate.getDate();
            const month = monthNames[currentIstDate.getMonth()];
            const year = currentIstDate.getFullYear();
            const formattedDate = `${month} ${day} ${year}`;

            const message = `Hi             ,\nMeeting Link: \nscheduled on ${formattedDate}\nPlease join the meeting.\nThank you.`;

            await whatsappService.sendTextMessage(groupId, message);
            logger.info(`Daily meeting message sent to group ${groupId} for ${formattedDate}`);
        } catch (error) {
            logger.error('Error in daily meeting message task:', error.message);
        }
    }

    /**
     * Send reminders 5 minutes before a review starts
     * @param {Date} currentIstDate - Current date/time in IST
     */
    async send5MinReminders(currentIstDate) {
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
                .populate('reviewer', 'fullName username email mobileNo');

            for (const review of reviews) {
                const targetTime = review.confirmedTime || review.scheduledTime;
                if (!targetTime) continue;

                // Parse time into a date object sharing the same timezone context as currentIstDate
                const scheduledTimeIst = this._parseTimeToDate(currentIstDate, targetTime);
                if (!scheduledTimeIst) continue;

                // Difference in minutes
                const diffMs = scheduledTimeIst - currentIstDate;
                const diffMins = Math.round(diffMs / 60000);

                // If scheduled in exactly 5 minutes (catch 4-5 range)
                if (diffMins >= 4 && diffMins <= 5) {
                    const student = review.student;
                    const notificationData = {
                        studentName: student?.name || 'Student',
                        studentUsername: student?.username,
                        studentEmail: student?.email,
                        reviewerName: review.reviewer?.fullName || review.reviewer?.username || review.reviewer?.email || 'Mentor',
                        taskName: review.programTask?.name || 'Task Review',
                        time: review.confirmedTime || review.scheduledTime,
                        date: review.scheduledDate,
                        reviewerMobile: review.reviewer?.mobileNo
                    };

                    const groupId = config.whapi?.groupId || '120363417698652224@g.us';

                    if (config.send_review_reminder_to_group) {
                        // Send to dynamic Group ID
                        await whatsappService.sendNotification(groupId, 'REVIEW_REMINDER', notificationData);

                        // Mark as sent
                        await TaskReview.findByIdAndUpdate(review._id, { isReminderSent: true });

                        logger.info(`5-min reminder for ${student?.name} sent to group ${groupId}`);
                    }
                }
            }
        } catch (error) {
            logger.error('Error in 5-min reminder task:', error.message);
        }
    }

    /**
     * Send FCM push notifications to students 2 minutes before their review starts
     * @param {Date} currentIstDate - Current date/time in IST
     */
    async send2MinStudentReminders(currentIstDate) {
        try {
            // Get start and end of today in IST
            const startOfDay = new Date(currentIstDate.getFullYear(), currentIstDate.getMonth(), currentIstDate.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(currentIstDate.getFullYear(), currentIstDate.getMonth(), currentIstDate.getDate(), 23, 59, 59, 999);

            // Find reviews for today that haven't had a 2-min reminder sent
            const reviews = await TaskReview.find({
                scheduledDate: { $gte: startOfDay, $lte: endOfDay },
                isCancelled: false,
                isReviewCompleted: false,
                isActive: true,
                is2MinReminderSent: { $ne: true }
            })
                .populate('student', 'name email fcmToken')
                .populate('programTask', 'name')
                .populate('reviewer', 'fullName username googleMeetLink');

            for (const review of reviews) {
                const targetTime = review.confirmedTime || review.scheduledTime;
                if (!targetTime) continue;

                const scheduledTimeIst = this._parseTimeToDate(currentIstDate, targetTime);
                if (!scheduledTimeIst) continue;

                const diffMs = scheduledTimeIst - currentIstDate;
                const diffMins = Math.round(diffMs / 60000);

                // Trigger when review is 1-2 minutes away
                if (diffMins >= 1 && diffMins <= 2) {
                    const student = review.student;
                    const fcmToken = student?.fcmToken;

                    if (fcmToken) {
                        const reviewerName = review.reviewer?.fullName || review.reviewer?.username || 'Mentor';
                        const taskName = review.programTask?.name || 'Task Review';
                        const meetLink = review.reviewer?.googleMeetLink || '';

                        await notificationService.sendToDevice(fcmToken, {
                            title: 'Your Review Starts in 2 Minutes!',
                            body: `${taskName} with ${reviewerName}. Get ready to join!`,
                            data: {
                                type: 'REVIEW_REMINDER_2MIN',
                                reviewId: review._id.toString(),
                                meetLink: meetLink,
                                reviewerName: reviewerName,
                                taskName: taskName,
                                link: '/dashboard'
                            }
                        });

                        logger.info(`2-min FCM reminder sent to student ${student?.name} (${student?.email})`);
                    }

                    // Mark as sent regardless of FCM token availability
                    await TaskReview.findByIdAndUpdate(review._id, { is2MinReminderSent: true });
                }
            }
        } catch (error) {
            logger.error('Error in 2-min student reminder task:', error.message);
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
