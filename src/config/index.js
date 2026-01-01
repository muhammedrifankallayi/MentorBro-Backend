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
            '*',
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
};
