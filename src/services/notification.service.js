const { getMessaging, isFirebaseConfigured } = require('../config/firebase.config');

/**
 * Firebase Cloud Messaging Notification Service
 * 
 * This service provides methods to send push notifications using Firebase Cloud Messaging (FCM)
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Send to a single device:
 *    await notificationService.sendToDevice(fcmToken, {
 *        title: 'New Review Scheduled',
 *        body: 'Your review is scheduled for tomorrow at 10:00 AM',
 *        data: { reviewId: '123', type: 'review_scheduled' }
 *    });
 * 
 * 2. Send to multiple devices:
 *    await notificationService.sendToDevices([token1, token2], {
 *        title: 'Announcement',
 *        body: 'New features available!',
 *    });
 * 
 * 3. Send to a topic (all subscribed users):
 *    await notificationService.sendToTopic('all_reviewers', {
 *        title: 'New Task Available',
 *        body: 'A new task has been assigned',
 *    });
 */

class NotificationService {

    /**
     * Send notification to a single device
     * @param {string} fcmToken - The device's FCM token
     * @param {Object} notification - Notification payload
     * @param {string} notification.title - Notification title
     * @param {string} notification.body - Notification body/message
     * @param {string} [notification.imageUrl] - Optional image URL
     * @param {Object} [notification.data] - Optional custom data payload
     * @returns {Promise<Object>} - Response from FCM
     */
    async sendToDevice(fcmToken, { title, body, imageUrl, data = {} }) {
        if (!isFirebaseConfigured()) {
            console.warn('Firebase not configured. Skipping notification.');
            return { success: false, error: 'Firebase not configured' };
        }

        if (!fcmToken) {
            return { success: false, error: 'No FCM token provided' };
        }

        try {
            const messaging = getMessaging();

            const message = {
                token: fcmToken,
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl }),
                },
                data: this._stringifyData(data),
                // Android specific configuration
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'default',
                        priority: 'high',
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                },
                // Web push specific configuration
                webpush: {
                    notification: {
                        icon: '/assets/icons/notification-icon.png',
                        badge: '/assets/icons/badge-icon.png',
                        requireInteraction: true,
                    },
                    fcmOptions: {
                        link: data.link || '/',
                    },
                },
                // iOS specific configuration
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title,
                                body,
                            },
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await messaging.send(message);
            console.log('✅ Notification sent successfully:', response);
            return { success: true, messageId: response };

        } catch (error) {
            console.error('❌ Error sending notification:', error.message);

            // Handle specific FCM errors
            if (error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token') {
                return {
                    success: false,
                    error: 'Invalid or expired token',
                    shouldRemoveToken: true
                };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification to multiple devices
     * @param {string[]} fcmTokens - Array of FCM tokens
     * @param {Object} notification - Notification payload
     * @returns {Promise<Object>} - Response with success/failure counts
     */
    async sendToDevices(fcmTokens, { title, body, imageUrl, data = {} }) {
        if (!isFirebaseConfigured()) {
            console.warn('Firebase not configured. Skipping notification.');
            return { success: false, error: 'Firebase not configured' };
        }

        if (!fcmTokens || fcmTokens.length === 0) {
            return { success: false, error: 'No FCM tokens provided' };
        }

        // Filter out invalid tokens
        const validTokens = fcmTokens.filter(token => token && typeof token === 'string');

        if (validTokens.length === 0) {
            return { success: false, error: 'No valid FCM tokens provided' };
        }

        try {
            const messaging = getMessaging();

            const message = {
                tokens: validTokens,
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl }),
                },
                data: this._stringifyData(data),
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'default',
                        priority: 'high',
                        defaultSound: true,
                    },
                },
                webpush: {
                    notification: {
                        icon: '/assets/icons/notification-icon.png',
                        requireInteraction: true,
                    },
                },
            };

            const response = await messaging.sendEachForMulticast(message);

            console.log(`✅ Multicast notification: ${response.successCount} success, ${response.failureCount} failures`);

            // Collect tokens that failed
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    if (resp.error?.code === 'messaging/registration-token-not-registered' ||
                        resp.error?.code === 'messaging/invalid-registration-token') {
                        failedTokens.push(validTokens[idx]);
                    }
                }
            });

            return {
                success: response.successCount > 0,
                successCount: response.successCount,
                failureCount: response.failureCount,
                invalidTokens: failedTokens,
            };

        } catch (error) {
            console.error('❌ Error sending multicast notification:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification to a topic (all subscribed devices)
     * @param {string} topic - Topic name (e.g., 'all_users', 'reviewers', 'students')
     * @param {Object} notification - Notification payload
     * @returns {Promise<Object>} - Response from FCM
     */
    async sendToTopic(topic, { title, body, imageUrl, data = {} }) {
        if (!isFirebaseConfigured()) {
            console.warn('Firebase not configured. Skipping notification.');
            return { success: false, error: 'Firebase not configured' };
        }

        if (!topic) {
            return { success: false, error: 'No topic provided' };
        }

        try {
            const messaging = getMessaging();

            const message = {
                topic: topic,
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl }),
                },
                data: this._stringifyData(data),
                android: {
                    priority: 'high',
                },
                webpush: {
                    notification: {
                        icon: '/assets/icons/notification-icon.png',
                        requireInteraction: true,
                    },
                },
            };

            const response = await messaging.send(message);
            console.log(`✅ Topic notification sent to "${topic}":`, response);
            return { success: true, messageId: response };

        } catch (error) {
            console.error(`❌ Error sending topic notification to "${topic}":`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Subscribe devices to a topic
     * @param {string[]} fcmTokens - Array of FCM tokens
     * @param {string} topic - Topic name to subscribe to
     * @returns {Promise<Object>} - Subscription result
     */
    async subscribeToTopic(fcmTokens, topic) {
        if (!isFirebaseConfigured()) {
            return { success: false, error: 'Firebase not configured' };
        }

        if (!fcmTokens || fcmTokens.length === 0 || !topic) {
            return { success: false, error: 'Invalid parameters' };
        }

        try {
            const messaging = getMessaging();
            const response = await messaging.subscribeToTopic(fcmTokens, topic);

            console.log(`✅ Subscribed ${response.successCount} devices to topic "${topic}"`);
            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
            };

        } catch (error) {
            console.error(`❌ Error subscribing to topic "${topic}":`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unsubscribe devices from a topic
     * @param {string[]} fcmTokens - Array of FCM tokens
     * @param {string} topic - Topic name to unsubscribe from
     * @returns {Promise<Object>} - Unsubscription result
     */
    async unsubscribeFromTopic(fcmTokens, topic) {
        if (!isFirebaseConfigured()) {
            return { success: false, error: 'Firebase not configured' };
        }

        if (!fcmTokens || fcmTokens.length === 0 || !topic) {
            return { success: false, error: 'Invalid parameters' };
        }

        try {
            const messaging = getMessaging();
            const response = await messaging.unsubscribeFromTopic(fcmTokens, topic);

            console.log(`✅ Unsubscribed ${response.successCount} devices from topic "${topic}"`);
            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
            };

        } catch (error) {
            console.error(`❌ Error unsubscribing from topic "${topic}":`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Helper method to convert all data values to strings (FCM requirement)
     * @private
     */
    _stringifyData(data) {
        const stringified = {};
        for (const [key, value] of Object.entries(data)) {
            stringified[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return stringified;
    }
}

module.exports = new NotificationService();
