require('dotenv').config();
const { sendEmail } = require('./src/utils/brevo.mailer');

async function testBrevo() {
    console.log('--- Brevo SMTP Test ---');
    console.log(`Host: ${process.env.BREVO_HOST}`);
    console.log(`Port: ${process.env.BREVO_PORT}`);
    console.log(`User: ${process.env.BREVO_USER}`);

    console.log(`Debug Password: ${process.env.BREVO_PASSWORD ? process.env.BREVO_PASSWORD.substring(0, 5) + '...' : 'MISSING'}`);

    if (!process.env.BREVO_USER || !process.env.BREVO_PASSWORD) {
        console.error('❌ Error: BREVO_USER or BREVO_PASSWORD is missing in .env');
        return;
    }

    try {
        console.log('Sending test email...');
        const result = await sendEmail({
            to: 'fffsdffasdgsdg@gmail.com',
            subject: 'MentorBro - Brevo SMTP Test',
            text: 'This is a test email sent via Brevo SMTP to verify configuration.',
            html: '<h1>Brevo SMTP Test</h1><p>This is a test email sent via Brevo SMTP to verify configuration.</p>'
        });
        console.log('✅ SUCCESS! Email sent.');
        console.log('Message ID:', result.messageId);
    } catch (error) {
        console.error('\n❌ FAILURE: Could not send email.');
        console.error('Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('Hint: Check your BREVO_USER and BREVO_PASSWORD.');
        }
    }
}

testBrevo();
