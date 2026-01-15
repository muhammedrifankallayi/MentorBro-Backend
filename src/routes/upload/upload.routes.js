const express = require('express');
const uploadController = require('../../controllers/upload');
const { protect } = require('../../middleware/auth.middleware');
const { imageUpload, handleUploadError } = require('../../middleware/upload.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   POST /api/v1/upload/single
 * @desc    Upload a single image
 * @access  Private
 * @body    Form-data with 'image' field
 */
router.post(
    '/single',
    imageUpload.single('image'),
    handleUploadError,
    uploadController.uploadSingle
);

/**
 * @route   POST /api/v1/upload/multiple
 * @desc    Upload multiple images (max 10)
 * @access  Private
 * @body    Form-data with 'images' field (multiple files)
 */
router.post(
    '/multiple',
    imageUpload.array('images', 10),
    handleUploadError,
    uploadController.uploadMultiple
);

/**
 * @route   DELETE /api/v1/upload/delete
 * @desc    Delete an uploaded image
 * @access  Private
 * @body    { url: string } or { publicId: string }
 */
router.delete('/delete', uploadController.deleteUploadedImage);

module.exports = router;
