const mongoose = require('mongoose');

const commonCertificateSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    courseName: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    certificateDate: {
        type: Date,
        required: [true, 'Certificate date is required'],
        default: Date.now
    },
    certificateId: {
        type: String,
        required: [true, 'Certificate ID is required'],
        unique: true
    },
    organizationName: {
        type: String,
        default: 'MentorBroLearning LLP'
    },
    organizationSubtext: {
        type: String,
    }
}, {
    timestamps: true
});

const CommonCertificate = mongoose.model('CommonCertificate', commonCertificateSchema);

module.exports = CommonCertificate;
