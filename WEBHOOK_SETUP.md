# Webhook Configuration

## Overview
The GitHub webhook has been integrated into the main Express application as a public route, eliminating the need for a separate webhook server.

## Endpoint
```
POST https://your-domain.com/api/v1/webhook/github
```

## Configuration Steps

### 1. GitHub Webhook Setup
1. Go to your GitHub repository settings
2. Navigate to **Settings > Webhooks > Add webhook**
3. Configure the webhook:
   - **Payload URL**: `https://your-domain.com/api/v1/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: (Optional but recommended for security)
   - **Events**: Select "Just the push event" or customize as needed
   - **Active**: ✓ Checked

### 2. Server Configuration
The webhook endpoint is:
- **Public** - No authentication required
- **Rate-limited** - Part of the general API rate limiting
- **CORS enabled** - Accessible from external sources

### 3. Security Enhancements (Optional but Recommended)

To verify that webhooks are actually from GitHub, you can add signature verification:

Add to your `.env` file:
```env
GITHUB_WEBHOOK_SECRET=your_secret_here
```

Then uncomment and implement the signature verification in `webhook.controller.js`:
```javascript
const crypto = require('crypto');

function verifySignature(signature, payload) {
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### 4. Deployment Script
Ensure your `deploy.sh` script exists at `/var/www/MentorBro-Backend/deploy.sh` and is executable:
```bash
chmod +x /var/www/MentorBro-Backend/deploy.sh
```

## Testing

### Test the webhook locally:
```bash
curl -X POST http://localhost:3000/api/v1/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main"}'
```

### Test the webhook in production:
```bash
curl -X POST https://your-domain.com/api/v1/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main"}'
```

## Response Format

### Success Response (200):
```json
{
  "success": true,
  "message": "Deployment triggered successfully",
  "timestamp": "2026-01-07T14:30:00.000Z"
}
```

### Error Response (500):
```json
{
  "success": false,
  "message": "Deployment failed",
  "error": "Error details (development only)"
}
```

## Migration from Old Setup

The old standalone webhook server (`webhook.js` on port 9000) is **no longer needed** and can be:
- Stopped if running as a service
- Removed from your process manager (PM2, systemd, etc.)
- Deleted or archived

The webhook is now part of the main application running on your primary port (typically 3000 or as configured).

## Logs

Webhook activities are logged through the application's logger:
- Check application logs for webhook events
- Look for entries: "GitHub webhook received" and "Deployment successful/failed"

## Troubleshooting

1. **Webhook not triggering deployment**:
   - Check application logs
   - Verify deploy.sh path is correct
   - Ensure deploy.sh has execute permissions

2. **404 errors**:
   - Verify the webhook URL includes `/api/v1/webhook/github`
   - Check that the application is running

3. **500 errors**:
   - Check deploy.sh script for errors
   - Verify file paths in the deployment script
   - Check application error logs
