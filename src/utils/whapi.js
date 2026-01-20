const config = require('../config');
const logger = require('./logger');

/**
 * Whapi.Cloud utility for interacting with the Whapi API
 */
class WhapiUtility {
    constructor() {
        this.token = config.whapi.token;
        this.apiUrl = config.whapi.apiUrl;
        this.headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': `Bearer ${this.token}`
        };
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
            const url = `${this.apiUrl}/messages/text`;
            const payload = {
                to,
                body,
                ...options
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers,
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
     * @returns {boolean}
     */
    isConfigured() {
        return !!this.token;
    }
}

module.exports = new WhapiUtility();
