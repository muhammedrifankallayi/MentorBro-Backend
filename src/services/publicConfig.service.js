const { PublicConfig } = require('../models');

class PublicConfigService {
    async getConfig() {
        const config = await PublicConfig.getSettings();
        return config;
    }

    async updateConfig(updateData) {
        const config = await PublicConfig.getSettings();

        if (updateData.whatsAppGroupLink !== undefined) {
            config.whatsAppGroupLink = updateData.whatsAppGroupLink;
        }

        await config.save();
        return config;
    }
}

module.exports = new PublicConfigService();
