const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');

/**
 * Allowed file types for image uploads
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * File filter for image uploads
 */
const imageFileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
    }
};

/**
 * Create Cloudinary storage configuration
 * @param {object} options - Storage options
 * @param {string} options.folder - Cloudinary folder name
 * @param {string[]} [options.allowedFormats] - Allowed file formats
 * @param {string} [options.transformation] - Image transformation options
 * @returns {CloudinaryStorage} - Cloudinary storage instance
 */
const createCloudinaryStorage = (options = {}) => {
    const {
        folder = 'mentorbro',
        allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation = { quality: 'auto', fetch_format: 'auto' },
    } = options;

    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const filename = path.parse(file.originalname).name;

            return {
                folder: folder,
                public_id: `${filename}-${uniqueSuffix}`,
                allowed_formats: allowedFormats,
                transformation: transformation,
            };
        },
    });
};

/**
 * Multer upload configuration for single image upload
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder name
 * @param {number} [options.maxSize] - Maximum file size in bytes (default: 5MB)
 * @returns {multer.Multer} - Multer instance
 */
const createImageUpload = (options = {}) => {
    const { folder = 'mentorbro', maxSize = 5 * 1024 * 1024 } = options; // 5MB default

    const storage = createCloudinaryStorage({ folder });

    return multer({
        storage: storage,
        fileFilter: imageFileFilter,
        limits: {
            fileSize: maxSize,
        },
    });
};

// Pre-configured upload instances for common use cases

/**
 * Upload middleware for profile pictures
 * Folder: mentorbro/profiles
 * Max size: 2MB
 */
const profileUpload = createImageUpload({
    folder: 'mentorbro/profiles',
    maxSize: 2 * 1024 * 1024, // 2MB
});

/**
 * Upload middleware for general images
 * Folder: mentorbro/images
 * Max size: 5MB
 */
const imageUpload = createImageUpload({
    folder: 'mentorbro/images',
    maxSize: 5 * 1024 * 1024, // 5MB
});

/**
 * Upload middleware for task/review related images
 * Folder: mentorbro/tasks
 * Max size: 5MB
 */
const taskImageUpload = createImageUpload({
    folder: 'mentorbro/tasks',
    maxSize: 5 * 1024 * 1024, // 5MB
});

/**
 * Upload middleware for student documents
 * Folder: mentorbro/students
 * Max size: 10MB
 */
const studentUpload = createImageUpload({
    folder: 'mentorbro/students',
    maxSize: 10 * 1024 * 1024, // 10MB
});

/**
 * Error handling middleware for multer errors
 */
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds the maximum allowed limit',
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    if (error.message && error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    next(error);
};

module.exports = {
    createImageUpload,
    createCloudinaryStorage,
    profileUpload,
    imageUpload,
    taskImageUpload,
    studentUpload,
    handleUploadError,
    ALLOWED_IMAGE_TYPES,
};
