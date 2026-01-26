require('dotenv').config();
const { sendPasswordResetEmail } = require('./src/utils/mailer');
const mongoose = require('mongoose');

async function testResetEmail() {
    console.log('--- Brevo Reset Password Test ---');

    // We don't necessarily need MongoDB for ONLY sending the email if .env is set
    // but getBrevoConfig tries to findOne.
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (e) {
        console.log('Continuing without MongoDB...');
    }

    const testEmail = "rifanrifan55544@gmail.com";
    const resetToken = "test_token_123";
    const resetURL = "http://localhost:3000/auth/reset-password/test_token_123";

    try {
        console.log(`Sending reset email to ${testEmail}...`);
        const result = await sendPasswordResetEmail(testEmail, resetToken, resetURL);
        console.log('✅ Success! Result:', result);
    } catch (error) {
        console.error('❌ Failure:', error.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(0);
    }
}

testResetEmail();
