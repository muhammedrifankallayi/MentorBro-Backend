const publicConfigService = require('../services/publicConfig.service');

const getPublicConfig = async (req, res, next) => {
    try {
        const config = await publicConfigService.getConfig();
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        next(error);
    }
};

const updatePublicConfig = async (req, res, next) => {
    try {
        const config = await publicConfigService.updateConfig(req.body);
        res.status(200).json({
            success: true,
            message: 'Public configuration updated successfully',
            data: config
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPublicConfig,
    updatePublicConfig
};
