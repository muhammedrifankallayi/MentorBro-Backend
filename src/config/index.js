module.exports = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        cookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7,
    },

    // Rate Limiting Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    },

    // CORS Configuration
    cors: {
        origin: [
            'http://localhost:4200',
            "http://localhost:4201",
            "http://localhost:4202",
            'http://localhost:4201',
            'https://studentmentorbro.netlify.app',
            'https://learn.yourmentorbro.com',
            'https://work.yourmentorbro.com',
            'https://manage.yourmentorbro.com',

            process.env.CORS_ORIGIN,
        ].filter(Boolean),
        credentials: true,
        optionsSuccessStatus: 200,
    },

    // Pagination Defaults
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
    },

    // Password Configuration
    password: {
        saltRounds: 12,
        minLength: 8,
    },

    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },

    // Whapi Configuration
    whapi: {
        token: process.env.WHAPI_TOKEN || 'M6jRXqIyz5QWuBtAC31XmmJGKPJcUjYF',
        apiUrl: process.env.WHAPI_API_URL || 'https://gate.whapi.cloud',
        defaultNumber: process.env.WHAPI_DEFAULT_NUMBER || '120363417698652224@g.us',
    },
};
