const mongoose = require('mongoose');

const aiCourseReviewSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        position: {
            type: String,
            trim: true,
            default: ''
        },
        image: {
            type: String,
            required: [true, 'Image URL is required'],
            trim: true
        },
        companyName: {
            type: String,
            trim: true,
            default: ''
        },
        reviewContent: {
            type: String,
            required: [true, 'Review content is required'],
            trim: true
        },
        linkedinURL: {
            type: String,
            required: [true, 'LinkedIn URL is required'],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const AiCourseReview = mongoose.model('AiCourseReview', aiCourseReviewSchema);

module.exports = AiCourseReview;
