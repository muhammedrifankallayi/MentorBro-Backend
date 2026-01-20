const config = require('../config');
const logger = require('./logger');
const SystemConfig = require('../models/systemConfig.model');

/**
 * Whapi.Cloud utility for interacting with the Whapi API
 */
class WhapiUtility {
    /**
     * Get current Whapi credentials from DB or Env
     * @private
     */
    async _getCredentials() {
        try {
            const dbConfig = await SystemConfig.findOne({ isActive: true });

            const token = dbConfig?.whapi?.token || config.whapi.token;
            const apiUrl = dbConfig?.whapi?.apiUrl || config.whapi.apiUrl;

            return { token, apiUrl };
        } catch (error) {
            // Fallback to env config if DB fails
            return {
                token: config.whapi.token,
                apiUrl: config.whapi.apiUrl
            };
        }
    }

    /**
     * Send a text message
     * @param {string} to - Recipient phone number or chat ID
     * @param {string} body - Message text
     * @param {Object} options - Additional options (typing_time, mentions, etc.)
     * @returns {Promise<Object>} - API response
     */
    async sendTextMessage(to, body, options = {}) {
        try {
            const { token, apiUrl } = await this._getCredentials();

            if (!token) {
                throw new Error('Whapi token not configured');
            }

            const url = `${apiUrl}/messages/text`;
            const payload = {
                to,
                body,
                ...options
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                logger.error('Whapi sendTextMessage error:', data);
                throw new Error(data.message || 'Failed to send WhatsApp message');
            }

            logger.info(`WhatsApp message sent to ${to}: ${data.message?.id || 'Success'}`);
            return data;
        } catch (error) {
            logger.error('Whapi sendTextMessage exception:', error.message);
            throw error;
        }
    }

    /**
     * Check if Whapi is configured
     * @returns {Promise<boolean>}
     */
    async isConfigured() {
        const { token } = await this._getCredentials();
        return !!token;
    }
}

module.exports = new WhapiUtility();
