const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
    {
        whapi: {
            token: { type: String, trim: true },
            apiUrl: { type: String, trim: true, default: 'https://gate.whapi.cloud' },
            defaultNumber: { type: String, trim: true }
        },
        brevo: {
            host: { type: String, trim: true },
            port: { type: Number },
            user: { type: String, trim: true },
            password: { type: String, trim: true }
        },
        firebase: {
            clientEmail: { type: String, trim: true },
            privateKey: { type: String, trim: true },
            projectId: { type: String, trim: true }
        },
        send_mail_on_reviewer_assign_to_student: {
            type: Boolean,
            default: true
        },
        receive_message_on_whatsapp_in_review_schedule: {
            type: Boolean,
            default: true
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
systemConfigSchema.statics.getSettings = async function () {
    let config = await this.findOne({ isActive: true });
    if (!config) {
        config = await this.create({ isActive: true });
    }
    return config;
};

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

module.exports = SystemConfig;
