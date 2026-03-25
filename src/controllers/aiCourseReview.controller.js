const aiCourseReviewService = require('../services/aiCourseReview.service');

const addReview = async (req, res, next) => {
    try {
        const review = await aiCourseReviewService.addReview(req.body);
        res.status(201).json({
            success: true,
            message: 'AI Course Review added successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

const getList = async (req, res, next) => {
    try {
        const reviews = await aiCourseReviewService.getList();
        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const review = await aiCourseReviewService.deleteReview(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'AI Course Review deleted successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addReview,
    getList,
    deleteReview
};
