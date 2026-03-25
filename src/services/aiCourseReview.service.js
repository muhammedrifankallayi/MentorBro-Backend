const { AiCourseReview } = require('../models');

class AiCourseReviewService {
    /**
     * Add a new AI course review
     * @param {Object} reviewData
     * @returns {Object} created review
     */
    async addReview(reviewData) {
        const review = await AiCourseReview.create(reviewData);
        return review;
    }

    /**
     * Get list of all AI course reviews
     * @returns {Array} List of reviews
     */
    async getList() {
        const reviews = await AiCourseReview.find().sort({ createdAt: -1 });
        return reviews;
    }

    /**
     * Delete an AI course review by ID
     * @param {String} reviewId
     * @returns {Object} deleted review
     */
    async deleteReview(reviewId) {
        const review = await AiCourseReview.findByIdAndDelete(reviewId);
        return review;
    }
}

module.exports = new AiCourseReviewService();
