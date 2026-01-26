require('dotenv').config();
const mongoose = require('mongoose');
const SystemConfig = require('./src/models/systemConfig.model');

async function debugSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const config = await SystemConfig.findOne({ isActive: true });
        if (config) {
            console.log('Current SystemConfig:', JSON.stringify(config.brevo, null, 2));
        } else {
            console.log('No active SystemConfig found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

debugSettings();
