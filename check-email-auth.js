require('dotenv').config();
const nodemailer = require('nodemailer');

async function checkCredentials() {
    console.log('--- Email Credential Checker ---');

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!user) {
        console.error('❌ Error: EMAIL_USER is missing in .env');
        return;
    }
    if (!pass) {
        console.error('❌ Error: EMAIL_PASSWORD is missing in .env');
        return;
    }

    console.log(`Testing with:`);
    console.log(`User: ${user}`);
    console.log(`Password Length: ${pass.length} characters (Should be 16 for Gmail App Password)`);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        console.log('\nAttempting to connect to Google SMTP...');
        await transporter.verify();
        console.log('✅ SUCCESS! Your credentials are correct and accepted.');
        console.log('You can delete this script now.');
    } catch (error) {
        console.error('\n❌ FAILURE: Credentials rejected.');
        console.error('---------------------------------------------------');
        console.error('Error Code:', error.code);
        console.error('Message:', error.message);
        console.error('---------------------------------------------------');

        if (error.response && error.response.includes('535')) {
            console.log('💡 Diagnosis: Google refused the login.');
            console.log('1. Check if EMAIL_USER is exactly your gmail address.');
            console.log('2. Check if EMAIL_PASSWORD is a valid 16-character App Password.');
            console.log('   (Do NOT use your normal Gmail login password)');
            if (pass.length !== 16) {
                console.log('   ⚠️ WARNING: Your password is ' + pass.length + ' chars. It should be exactly 16.');
            }
        }
    }
}

checkCredentials();
