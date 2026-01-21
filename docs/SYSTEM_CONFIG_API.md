# System Configuration API Documentation

This API allows administrators to manage third-party integration credentials (WhatsApp, Email, and Push Notifications) directly through the database. These settings persist across server restarts and override environment variables.

## Model: `SystemConfig`

The configuration is stored in a single active document in the `systemconfigs` collection.

| Field | Type | Description |
| :--- | :--- | :--- |
| `whapi.token` | String | Whapi.Cloud API Bearer Token |
| `whapi.apiUrl` | String | Whapi.Cloud Base URL (Default: `https://gate.whapi.cloud`) |
| `whapi.defaultNumber` | String | Default WhatsApp number for notifications |
| `brevo.host` | String | SMTP Host for email relay |
| `brevo.port` | Number | SMTP Port (e.g., 587) |
| `brevo.user` | String | SMTP Username/Email |
| `brevo.password` | String | SMTP Password |
| `firebase.clientEmail` | String | Firebase Client Email |
| `firebase.privateKey` | String | Firebase Private Key |
| `firebase.projectId` | String | Firebase Project ID |
| `send_mail_on_reviewer_assign_to_student` | Boolean | Toggle email to student when reviewer is assigned (Default: `true`) |
| `receive_message_on_whatsapp_in_review_schedule` | Boolean | Toggle WhatsApp message when review is scheduled (Default: `true`) |
| `isActive` | Boolean | Status of the configuration (Default: `true`) |

---

## Endpoints

### 1. Get System Configuration
Retrieve the current set of credentials and integration settings.

- **URL:** `/api/v1/admin/config`
- **Method:** `GET`
- **Auth Required:** YES (Role: `admin`)

#### Success Response
- **Code:** `200 OK`
- **Content:**
```json
{
    "success": true,
    "data": {
        "whapi": {
            "token": "M6j...",
            "apiUrl": "https://gate.whapi.cloud",
            "defaultNumber": "8157867616"
        },
        "brevo": {
            "host": "smtp-relay.brevo.com",
            "port": 587,
            "user": "admin@example.com",
            "password": "..."
        },
        "firebase": {
            "clientEmail": "firebase-adminsdk@...",
            "privateKey": "-----BEGIN PRIVATE KEY-----...",
            "projectId": "mentorbro-app"
        },
        "_id": "65ab...",
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
    }
}
```

---

### 2. Update System Configuration
Update one or more integration settings. Partial updates are supported (e.g., you can send only the `whapi` object to update WhatsApp settings).

- **URL:** `/api/v1/admin/config`
- **Method:** `PATCH`
- **Auth Required:** YES (Role: `admin`)

#### Request Body Example
```json
{
    "whapi": {
        "token": "NEW_WHAPI_TOKEN",
        "defaultNumber": "919876543210"
    },
    "brevo": {
        "password": "NEW_SMTP_PASSWORD"
    }
}
```

#### Success Response
- **Code:** `200 OK`
- **Content:**
```json
{
    "success": true,
    "message": "Configuration updated successfully",
    "data": { ... updated object ... }
}
```

---

## Integration Priority

The system follows this hierarchy for resolving credentials:
1. **Database Config**: Values stored via this API.
2. **Environment Variables**: Values defined in `.env`.
3. **Hardcoded Defaults**: Fallbacks defined in `src/config/index.js`.

If a field is missing in the database, the system automatically falls back to the environment variable.
