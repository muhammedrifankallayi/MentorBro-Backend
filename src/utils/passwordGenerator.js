const crypto = require('crypto');

/**
 * Generate a random secure password
 * @param {number} length - Length of the password (default: 12)
 * @param {Object} options - Password generation options
 * @returns {string} Generated password
 */
const generatePassword = (length = 12, options = {}) => {
    const {
        includeUppercase = true,
        includeLowercase = true,
        includeNumbers = true,
        includeSymbols = true,
    } = options;

    let charset = '';
    let password = '';

    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
        throw new Error('At least one character type must be included');
    }

    // Ensure at least one character from each selected type
    const guaranteedChars = [];
    if (includeLowercase) guaranteedChars.push('abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
    if (includeUppercase) guaranteedChars.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]);
    if (includeNumbers) guaranteedChars.push('0123456789'[Math.floor(Math.random() * 10)]);
    if (includeSymbols) guaranteedChars.push('!@#$%^&*'[Math.floor(Math.random() * 8)]);

    // Generate remaining characters
    const remainingLength = length - guaranteedChars.length;
    const randomBytes = crypto.randomBytes(remainingLength);

    for (let i = 0; i < remainingLength; i++) {
        password += charset[randomBytes[i] % charset.length];
    }

    // Add guaranteed characters
    password += guaranteedChars.join('');

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generate a simple readable password (alphanumeric only)
 * @param {number} length - Length of the password (default: 10)
 * @returns {string} Generated password
 */
const generateSimplePassword = (length = 10) => {
    return generatePassword(length, {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
    });
};

/**
 * Generate a strong password with symbols
 * @param {number} length - Length of the password (default: 16)
 * @returns {string} Generated password
 */
const generateStrongPassword = (length = 16) => {
    return generatePassword(length, {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
    });
};

module.exports = {
    generatePassword,
    generateSimplePassword,
    generateStrongPassword,
};
