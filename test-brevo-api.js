require('dotenv').config();
const { sendEmail } = require('./src/utils/brevo.mailer');

async function testBrevoApi() {
    console.log('--- Brevo API Test ---');

    // Use the key from existing env
    const apiKey = process.env.BREVO_PASSWORD;

    if (!apiKey) {
        console.error('❌ Error: BREVO_PASSWORD (API Key) is missing in .env');
        return;
    }

    console.log(`Using API Key: ${apiKey.substring(0, 10)}...`);

    try {
        console.log('Sending test email via API...');
        const result = await sendEmail({
            to: 'plooxacodecrafter@gmail.com',
            subject: 'MentorBro - Brevo API Test',
            text: 'This is a test email sent via Brevo API SDK.',
            html: '<h1>Brevo API Test</h1><p>This is a test email sent via Brevo API SDK.</p>'
        });
        console.log('✅ SUCCESS! Email sent.');
        console.log('Response:', result);
    } catch (error) {
        console.error('\n❌ FAILURE: Could not send email.');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('API Response Body:', JSON.stringify(error.response.body, null, 2));
        }
    }
}

testBrevoApi();
