const express = require('express');
const commonCertificateController = require('../../controllers/admin/commonCertificate.controller');

const router = express.Router();

router
    .route('/')
    .get(commonCertificateController.getAllCertificates)
    .post(commonCertificateController.saveCertificate);

router
    .route('/:id')
    .delete(commonCertificateController.deleteCertificate);

module.exports = router;
