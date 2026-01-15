const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Verify Cloudinary configuration
 * @returns {boolean} - Returns true if configuration is valid
 */
const verifyCloudinaryConfig = () => {
    const { cloud_name, api_key, api_secret } = cloudinary.config();

    if (!cloud_name || !api_key || !api_secret) {
        console.warn('⚠️  Cloudinary configuration is incomplete. Please check your environment variables.');
        return false;
    }

    console.log('✅ Cloudinary configured successfully');
    return true;
};

/**
 * Delete an image from Cloudinary by public ID
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<object>} - Cloudinary deletion result
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of public IDs to delete
 * @returns {Promise<object>} - Cloudinary deletion result
 */
const deleteMultipleImages = async (publicIds) => {
    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        throw error;
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} - Public ID or null if not found
 */
const getPublicIdFromUrl = (url) => {
    if (!url) return null;

    try {
        // Extract public ID from URL like:
        // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
        const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting public ID from URL:', error);
        return null;
    }
};

module.exports = {
    cloudinary,
    verifyCloudinaryConfig,
    deleteImage,
    deleteMultipleImages,
    getPublicIdFromUrl,
};
