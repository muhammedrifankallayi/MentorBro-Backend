# MentorBro Backend

A secure and scalable Node.js backend with MongoDB connection following best practices and clean architecture.

## 🏗️ Architecture

```
📁 MentorBro-Backend/
├── 📁 src/
│   ├── 📁 config/         # Configuration files
│   │   ├── database.js    # MongoDB connection
│   │   └── index.js       # App configuration
│   │
│   ├── 📁 controllers/    # Request handlers
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   │
│   ├── 📁 middleware/     # Custom middleware
│   │   ├── auth.middleware.js     # JWT authentication
│   │   ├── error.middleware.js    # Global error handler
│   │   └── validate.middleware.js # Joi validation
│   │
│   ├── 📁 models/         # Mongoose models
│   │   └── user.model.js
│   │
│   ├── 📁 routes/         # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── index.js
│   │
│   ├── 📁 services/       # Business logic
│   │   ├── auth.service.js
│   │   └── user.service.js
│   │
│   ├── 📁 utils/          # Utility functions
│   │   ├── apiResponse.js
│   │   ├── appError.js
│   │   ├── catchAsync.js
│   │   └── logger.js
│   │
│   ├── 📁 validations/    # Joi validation schemas
│   │   ├── auth.validation.js
│   │   └── user.validation.js
│   │
│   └── app.js             # Express app setup
│
├── server.js              # Entry point
├── package.json
├── .env.example
└── .gitignore
```

## 🔒 Security Features

- **Helmet** - Secure HTTP headers
- **CORS** - Cross-Origin Resource Sharing configuration
- **Rate Limiting** - Prevent brute force attacks
- **MongoDB Sanitization** - Prevent NoSQL injection
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Joi schema validation

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mentorbro
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRES_IN=7d
   ```

4. Start MongoDB locally (make sure MongoDB is running)

5. Start the server:
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Health Check
- `GET /api/v1/health` - Check API status

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `PATCH /api/v1/auth/update-password` - Update password

### Users (Admin only)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### User Profile
- `PATCH /api/v1/users/update-me` - Update current user profile
- `DELETE /api/v1/users/delete-me` - Deactivate account

## 📝 Usage Example

### Register a User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Access Protected Route

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "status": "fail",
  "message": "Error message here"
}
```

## 📄 License

ISC
