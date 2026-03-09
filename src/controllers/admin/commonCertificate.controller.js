const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { CommonCertificate } = require('../../models');

exports.saveCertificate = catchAsync(async (req, res, next) => {
    // Generate a new certificate if it doesn't already exist with same student and id
    const { certificateId, studentName } = req.body;

    // Check if ID already used by someone else
    const existing = await CommonCertificate.findOne({ certificateId });
    if (existing && existing.studentName !== studentName) {
        return next(new AppError('Certificate ID is already in use by another student!', 400));
    }

    let cert;
    if (existing) {
        // Update existing certificate if re-saving for same person with same ID
        cert = await CommonCertificate.findByIdAndUpdate(existing._id, req.body, {
            new: true,
            runValidators: true
        });
    } else {
        // Create new certificate
        cert = await CommonCertificate.create(req.body);
    }

    res.status(200).json({
        status: 'success',
        data: cert
    });
});

exports.getAllCertificates = catchAsync(async (req, res, next) => {
    const certificates = await CommonCertificate.find().sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: certificates.length,
        data: certificates
    });
});

exports.deleteCertificate = catchAsync(async (req, res, next) => {
    const cert = await CommonCertificate.findByIdAndDelete(req.params.id);
    if (!cert) {
        return next(new AppError('No certificate found with that ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});
