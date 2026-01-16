const notificationService = require('../services/notification.service');
const { isFirebaseConfigured } = require('../config/firebase.config');

/**
 * Notification Controller
 * Handles FCM token registration and notification endpoints
 */

/**
 * Register FCM token for a user
 * This endpoint should be called when a user logs in or when the FCM token refreshes
 * 
 * @route POST /api/v1/notification/register-token
 * @body { fcmToken: string, deviceType?: 'web' | 'android' | 'ios' }
 */
const registerToken = async (req, res) => {
    try {
        const { fcmToken, deviceType = 'web' } = req.body;

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required',
            });
        }

        // Get the authenticated user (assuming you have auth middleware)
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        // TODO: Save the FCM token to your database
        // Example: You might want to store this in a separate collection or add it to the user/reviewer/student model
        // 
        // await UserFcmToken.findOneAndUpdate(
        //     { userId, fcmToken },
        //     { userId, fcmToken, deviceType, lastUpdated: new Date() },
        //     { upsert: true, new: true }
        // );

        console.log(`📱 FCM token registered for user ${userId}: ${fcmToken.substring(0, 20)}...`);

        res.status(200).json({
            success: true,
            message: 'FCM token registered successfully',
        });

    } catch (error) {
        console.error('Error registering FCM token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register FCM token',
            error: error.message,
        });
    }
};

/**
 * Unregister FCM token (e.g., on logout)
 * 
 * @route POST /api/v1/notification/unregister-token
 * @body { fcmToken: string }
 */
const unregisterToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required',
            });
        }

        const userId = req.user?.id || req.user?._id;

        // TODO: Remove the FCM token from your database
        // 
        // await UserFcmToken.deleteOne({ userId, fcmToken });

        console.log(`📱 FCM token unregistered for user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'FCM token unregistered successfully',
        });

    } catch (error) {
        console.error('Error unregistering FCM token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unregister FCM token',
            error: error.message,
        });
    }
};

/**
 * Subscribe to a notification topic
 * 
 * @route POST /api/v1/notification/subscribe
 * @body { fcmToken: string, topic: string }
 */
const subscribeToTopic = async (req, res) => {
    try {
        const { fcmToken, topic } = req.body;

        if (!fcmToken || !topic) {
            return res.status(400).json({
                success: false,
                message: 'FCM token and topic are required',
            });
        }

        const result = await notificationService.subscribeToTopic([fcmToken], topic);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: `Subscribed to topic: ${topic}`,
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error,
            });
        }

    } catch (error) {
        console.error('Error subscribing to topic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe to topic',
            error: error.message,
        });
    }
};

/**
 * Unsubscribe from a notification topic
 * 
 * @route POST /api/v1/notification/unsubscribe
 * @body { fcmToken: string, topic: string }
 */
const unsubscribeFromTopic = async (req, res) => {
    try {
        const { fcmToken, topic } = req.body;

        if (!fcmToken || !topic) {
            return res.status(400).json({
                success: false,
                message: 'FCM token and topic are required',
            });
        }

        const result = await notificationService.unsubscribeFromTopic([fcmToken], topic);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: `Unsubscribed from topic: ${topic}`,
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error,
            });
        }

    } catch (error) {
        console.error('Error unsubscribing from topic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsubscribe from topic',
            error: error.message,
        });
    }
};

/**
 * Send a test notification (admin only - for testing purposes)
 * 
 * @route POST /api/v1/notification/send-test
 * @body { fcmToken: string, title: string, body: string, data?: object }
 */
const sendTestNotification = async (req, res) => {
    try {
        const { fcmToken, title, body, data } = req.body;

        if (!fcmToken || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'FCM token, title, and body are required',
            });
        }

        const result = await notificationService.sendToDevice(fcmToken, {
            title,
            body,
            data: data || {},
        });

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Test notification sent successfully',
                messageId: result.messageId,
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error,
            });
        }

    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message,
        });
    }
};

/**
 * Get Firebase configuration status
 * 
 * @route GET /api/v1/notification/status
 */
const getStatus = async (req, res) => {
    try {
        const configured = isFirebaseConfigured();

        res.status(200).json({
            success: true,
            data: {
                firebaseConfigured: configured,
                message: configured
                    ? 'Firebase is properly configured and ready to send notifications'
                    : 'Firebase is not configured. Push notifications will not work.',
            },
        });

    } catch (error) {
        console.error('Error checking Firebase status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check Firebase status',
            error: error.message,
        });
    }
};

module.exports = {
    registerToken,
    unregisterToken,
    subscribeToTopic,
    unsubscribeFromTopic,
    sendTestNotification,
    getStatus,
};
