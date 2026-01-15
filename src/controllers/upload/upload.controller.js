const { catchAsync, ApiResponse } = require('../../utils');
const { deleteImage, getPublicIdFromUrl } = require('../../config/cloudinary');

/**
 * @desc    Upload a single image
 * @route   POST /api/v1/upload/single
 * @access  Private
 */
const uploadSingle = catchAsync(async (req, res) => {
    if (!req.file) {
        return ApiResponse.badRequest(res, 'No image file provided');
    }

    const imageData = {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
    };

    ApiResponse.success(res, { image: imageData }, 'Image uploaded successfully');
});

/**
 * @desc    Upload multiple images (up to 10)
 * @route   POST /api/v1/upload/multiple
 * @access  Private
 */
const uploadMultiple = catchAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return ApiResponse.badRequest(res, 'No images provided');
    }

    const images = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
    }));

    ApiResponse.success(
        res,
        {
            images,
            count: images.length
        },
        `${images.length} image(s) uploaded successfully`
    );
});

/**
 * @desc    Delete an image by URL or public ID
 * @route   DELETE /api/v1/upload/delete
 * @access  Private
 */
const deleteUploadedImage = catchAsync(async (req, res) => {
    const { url, publicId } = req.body;

    if (!url && !publicId) {
        return ApiResponse.badRequest(res, 'Please provide either url or publicId');
    }

    let idToDelete = publicId;

    // If URL is provided, extract public ID from it
    if (url && !publicId) {
        idToDelete = getPublicIdFromUrl(url);
        if (!idToDelete) {
            return ApiResponse.badRequest(res, 'Could not extract public ID from URL');
        }
    }

    const result = await deleteImage(idToDelete);

    if (result.result === 'ok') {
        ApiResponse.success(res, { deleted: idToDelete }, 'Image deleted successfully');
    } else if (result.result === 'not found') {
        ApiResponse.notFound(res, 'Image not found in Cloudinary');
    } else {
        ApiResponse.badRequest(res, 'Failed to delete image');
    }
});

module.exports = {
    uploadSingle,
    uploadMultiple,
    deleteUploadedImage,
};
