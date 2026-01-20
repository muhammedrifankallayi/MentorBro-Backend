const systemConfigService = require('../services/systemConfig.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Get system configuration
 */
const getConfig = catchAsync(async (req, res, next) => {
    const config = await systemConfigService.getConfig();

    res.status(200).json({
        success: true,
        data: config
    });
});

/**
 * Update system configuration
 */
const updateConfig = catchAsync(async (req, res, next) => {
    const config = await systemConfigService.updateConfig(req.body);

    res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: config
    });
});

module.exports = {
    getConfig,
    updateConfig
};
