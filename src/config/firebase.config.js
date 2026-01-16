const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * Firebase Admin SDK Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Select your project
 * 3. Go to Project Settings > Service Accounts
 * 4. Click "Generate new private key"
 * 5. Save the downloaded JSON file as 'firebase-service-account.json' in the config folder
 *    OR set the FIREBASE_SERVICE_ACCOUNT_PATH environment variable to point to your file
 * 
 * ENVIRONMENT VARIABLES (add these to your .env file):
 * - FIREBASE_SERVICE_ACCOUNT_PATH: Path to your Firebase service account JSON file (optional)
 *   Default: ./src/config/firebase-service-account.json
 * 
 * OR use individual environment variables:
 * - FIREBASE_PROJECT_ID: Your Firebase project ID
 * - FIREBASE_PRIVATE_KEY: Your Firebase private key (with newlines as \n)
 * - FIREBASE_CLIENT_EMAIL: Your Firebase client email
 */

let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        // First, try to use individual environment variables
        if (process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_PRIVATE_KEY &&
            process.env.FIREBASE_CLIENT_EMAIL) {

            const serviceAccount = {
                type: 'service_account',
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
            };

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            console.log('✅ Firebase Admin SDK initialized with environment variables');
            return firebaseApp;
        }

        // Second, try to load from service account JSON file
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
            path.join(__dirname, 'firebase-service-account.json');

        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            console.log('✅ Firebase Admin SDK initialized with service account file');
            return firebaseApp;
        }

        // Firebase not configured - log warning but don't crash the app
        console.warn('⚠️ Firebase not configured. Push notifications will not work.');
        console.warn('   To enable push notifications, set up Firebase credentials:');
        console.warn('   - Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL env vars');
        console.warn('   - OR place firebase-service-account.json in src/config/ folder');

        return null;

    } catch (error) {
        console.error('❌ Error initializing Firebase Admin SDK:', error.message);
        return null;
    }
};

/**
 * Get the Firebase Admin messaging instance
 * @returns {admin.messaging.Messaging|null}
 */
const getMessaging = () => {
    const app = initializeFirebase();
    if (!app) {
        return null;
    }
    return admin.messaging();
};

/**
 * Check if Firebase is properly configured
 * @returns {boolean}
 */
const isFirebaseConfigured = () => {
    return initializeFirebase() !== null;
};

module.exports = {
    initializeFirebase,
    getMessaging,
    isFirebaseConfigured,
    admin,
};
