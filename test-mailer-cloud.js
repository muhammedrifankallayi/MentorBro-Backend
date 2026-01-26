require('dotenv').config();
const { sendEmail, createEmailCampaign } = require('./src/utils/mailer');
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
    const testEmail = "mikkycopy@gmail.com";

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

        // 2. Test Campaign Creation
        // Note: This won't actually "send" unless scheduled/started, and requires valid listIds
        console.log('\n2. Testing Campaign Creation (SDK)...');
        try {
            const campaignData = await createEmailCampaign({
                name: "Test Campaign " + Date.now(),
                subject: "Welcome to Our New Program",
                html: "<h1>Hello!</h1><p>This is a test campaign created via SDK.</p>",
                listIds: [1], // Use a valid list ID from your Brevo account if known
                // scheduledAt: '2026-02-01 10:00:00' // Optional
            });
            console.log('✅ Success! Campaign created. ID:', campaignData.id);
        } catch (campErr) {
            console.warn('⚠️ Campaign Creation Failed (likely due to invalid listIds):', campErr.message);
            console.log('Note: This is expected if listIds [1] doesn\'t exist in your account.');
        }

    } catch (error) {
        console.error('\n❌ FAILURE:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

testCloudMailer();
