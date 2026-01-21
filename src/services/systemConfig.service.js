const SystemConfig = require('../models/systemConfig.model');

/**
 * Get the active system configuration
 * Creates a default config if none exists
 * @returns {Promise<Object>} - The system configuration object
 */
const getConfig = async () => {
    return await SystemConfig.getSettings();
};

/**
 * Update system configuration
 * Supports partial updates for whapi, brevo, and firebase sections
 * @param {Object} updateData - The configuration data to update
 * @returns {Promise<Object>} - The updated system configuration
 */
const updateConfig = async (updateData) => {
    let config = await SystemConfig.findOne({ isActive: true });

    if (!config) {
        config = await SystemConfig.create(updateData);
    } else {
        // Update only the fields provided in the request body
        // This allows partial updates for whapi, brevo, or firebase
        if (updateData.whapi) {
            config.whapi = {
                ...config.whapi.toObject ? config.whapi.toObject() : config.whapi,
                ...updateData.whapi
            };
        }
        if (updateData.brevo) {
            config.brevo = {
                ...config.brevo.toObject ? config.brevo.toObject() : config.brevo,
                ...updateData.brevo
            };
        }
        if (updateData.firebase) {
            config.firebase = {
                ...config.firebase.toObject ? config.firebase.toObject() : config.firebase,
                ...updateData.firebase
            };
        }

        // Handle boolean notification toggles
        if (updateData.send_mail_on_reviewer_assign_to_student !== undefined) {
            config.send_mail_on_reviewer_assign_to_student = updateData.send_mail_on_reviewer_assign_to_student;
        }
        if (updateData.receive_message_on_whatsapp_in_review_schedule !== undefined) {
            config.receive_message_on_whatsapp_in_review_schedule = updateData.receive_message_on_whatsapp_in_review_schedule;
        }

        await config.save();
    }

    return config;
};

/**
 * Get specific config section (whapi, brevo, or firebase)
 * @param {string} section - The section name ('whapi', 'brevo', or 'firebase')
 * @returns {Promise<Object|null>} - The section configuration or null
 */
const getConfigSection = async (section) => {
    const config = await SystemConfig.getSettings();
    return config[section] || null;
};

/**
 * Check if a configuration section has valid credentials
 * @param {string} section - The section name ('whapi', 'brevo', or 'firebase')
 * @returns {Promise<boolean>} - True if the section has required credentials
 */
const hasValidCredentials = async (section) => {
    const config = await SystemConfig.getSettings();

    switch (section) {
        case 'whapi':
            return !!(config.whapi && config.whapi.token);
        case 'brevo':
            return !!(config.brevo && config.brevo.host && config.brevo.user && config.brevo.password);
        case 'firebase':
            return !!(config.firebase && config.firebase.clientEmail && config.firebase.privateKey && config.firebase.projectId);
        default:
            return false;
    }
};

module.exports = {
    getConfig,
    updateConfig,
    getConfigSection,
    hasValidCredentials,
};
