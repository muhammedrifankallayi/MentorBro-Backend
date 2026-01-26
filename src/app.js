const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Load environment variables
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middleware');
const { AppError, logger } = require('./utils');
const config = require('./config');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors(config.cors));

// Rate limiting - prevent brute force attacks
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

// Body parser - parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================
// COMPRESSION & LOGGING
// ============================================

// Compress responses
app.use(compression());

// HTTP request logger (development only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ============================================
// ROUTES
// ============================================

// API routes
app.use('/api/v1', routes);

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to MentorBro API',
        version: '1.0.11',
        documentation: '/api/v1/docs',
    })
});

// ============================================
// ERROR HANDLING
// ============================================

// Handle 404 - Route not found
app.all('*', (req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
