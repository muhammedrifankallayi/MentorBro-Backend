const mongoose = require('mongoose');

const publicConfigSchema = new mongoose.Schema(
    {
        whatsAppGroupLink: {
            type: String,
            trim: true,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// We only want one configuration document
publicConfigSchema.statics.getSettings = async function () {
    let config = await this.findOne({ isActive: true });
    if (!config) {
        config = await this.create({ isActive: true });
    }
    return config;
};

const PublicConfig = mongoose.model('PublicConfig', publicConfigSchema);

module.exports = PublicConfig;
