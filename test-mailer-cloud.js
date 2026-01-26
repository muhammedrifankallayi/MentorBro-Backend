require('dotenv').config();
const { sendEmail } = require('./src/utils/mailer');
const mongoose = require('mongoose');

async function testCloudMailer() {
    console.log('--- Brevo SDK Test ---');

    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.warn('⚠️ Warning: Could not connect to MongoDB. Falling back to .env only.');
    }

    const apiKey = process.env.BREVO_API_KEY;
    const testEmail = "rifanrifan55544@gmail.com";

    if (!apiKey) {
        console.error('❌ Error: BREVO_API_KEY is missing in .env');
        process.exit(1);
    }

    console.log(`Using API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Test Email: ${testEmail}`);

    try {
        // 1. Test Transactional Email
        console.log('\n1. Testing Transactional Email (SDK)...');
        const emailResult = await sendEmail({
            to: testEmail,
            subject: 'MentorBro - SDK Transactional Test',
            text: 'This is a test email sent via Brevo SDK implementation.',
            html: '<h1>Brevo SDK Test</h1><p>Success! This email uses the new sib-api-v3-sdk implementation.</p>'
        });
        console.log('✅ Success! Transactional Email sent. ID:', emailResult.messageId);

    } catch (error) {
        console.error('\n❌ FAILURE:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

testCloudMailer();
