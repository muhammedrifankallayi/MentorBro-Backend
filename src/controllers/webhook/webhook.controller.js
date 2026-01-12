const { exec } = require('child_process');
const { logger } = require('../../utils');

/**
 * Handle GitHub webhook for deployment
 * @desc Triggers deployment script when GitHub webhook is received
 * @route POST /api/v1/webhook/github
 * @access Public
 */
const handleGitHubWebhook = async (req, res, next) => {
    try {
        logger.info('GitHub webhook received');

        // Optional: Verify webhook signature for security
        // const signature = req.headers['x-hub-signature-256'];
        // if (!verifySignature(signature, req.body)) {
        //     return res.status(401).json({ success: false, message: 'Invalid signature' });
        // }

        // Execute deployment script
        exec('bash /var/www/MentorBro-Backend/deploy.sh', (err, stdout, stderr) => {
            if (err) {
                logger.error('Deployment failed:', err);
                console.error(stderr);
                return res.status(500).json({
                    success: false,
                    message: 'Deployment failed',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }

            logger.info('Deployment successful:', stdout);
            console.log(stdout);

            res.status(200).json({
                success: true,
                message: 'Deployment triggered successfully',
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        logger.error('Webhook error:', error);
        next(error);
    }
};

const handleWorkWebhook = async (req, res, next) => {
    try {
        logger.info('Work deployment webhook received');

        // Execute deployment script
        exec('bash /var/www/MentorBro-Reviewer/deploy-work.sh', (err, stdout, stderr) => {
            if (err) {
                logger.error('Work Deployment failed:', err);
                console.error(stderr);
                return res.status(500).json({
                    success: false,
                    message: 'Work Deployment failed',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }

            logger.info('Work Deployment successful:', stdout);
            console.log(stdout);

            res.status(200).json({
                success: true,
                message: 'Work Deployment triggered successfully',
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        logger.error('Webhook error:', error);
        next(error);
    }
};

const handleLearnWebhook = async (req, res, next) => {
    try {
        logger.info('Learn deployment webhook received');

        // Execute deployment script
        exec('bash /var/www/MentorBroManagement-Student/deploy-learn.sh', (err, stdout, stderr) => {
            if (err) {
                logger.error('Learn Deployment failed:', err);
                console.error(stderr);
                return res.status(500).json({
                    success: false,
                    message: 'Learn Deployment failed',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }

            logger.info('Learn Deployment successful:', stdout);
            console.log(stdout);

            res.status(200).json({
                success: true,
                message: 'Learn Deployment triggered successfully',
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        logger.error('Webhook error:', error);
        next(error);
    }
};

module.exports = {
    handleGitHubWebhook,
    handleWorkWebhook,
    handleLearnWebhook
};
