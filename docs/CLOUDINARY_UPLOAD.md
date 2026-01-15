# Cloudinary + Multer Image Upload Setup

This document explains how to use the Cloudinary image upload functionality in the MentorBro Backend.

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

You can get these credentials from your [Cloudinary Dashboard](https://cloudinary.com/console).

## Usage

### Pre-configured Upload Middlewares

The following pre-configured upload middlewares are available in `src/middleware/upload.middleware.js`:

| Middleware | Folder | Max Size | Use Case |
|------------|--------|----------|----------|
| `profileUpload` | mentorbro/profiles | 2MB | Profile pictures |
| `imageUpload` | mentorbro/images | 5MB | General images |
| `taskImageUpload` | mentorbro/tasks | 5MB | Task/review images |
| `studentUpload` | mentorbro/students | 10MB | Student documents |

### Example: Single Image Upload

#### Route Definition

```javascript
const express = require('express');
const router = express.Router();
const { profileUpload, handleUploadError } = require('../../middleware/upload.middleware');
const { protect } = require('../../middleware/auth.middleware');
const studentController = require('../../controllers/student');

// Single file upload - field name: 'profileImage'
router.patch(
    '/me/profile-image',
    protect,
    profileUpload.single('profileImage'),
    handleUploadError,
    studentController.updateProfileImage
);

module.exports = router;
```

#### Controller Implementation

```javascript
const { catchAsync, ApiResponse } = require('../../utils');
const { deleteImage, getPublicIdFromUrl } = require('../../config/cloudinary');
const Student = require('../../models/student.model');

const updateProfileImage = catchAsync(async (req, res) => {
    if (!req.file) {
        return ApiResponse.badRequest(res, 'No image file provided');
    }

    const student = await Student.findById(req.user._id);

    // Delete old profile image if exists
    if (student.profileImage) {
        const publicId = getPublicIdFromUrl(student.profileImage);
        if (publicId) {
            await deleteImage(publicId);
        }
    }

    // Update with new image URL
    student.profileImage = req.file.path; // Cloudinary URL
    await student.save();

    ApiResponse.success(res, { profileImage: student.profileImage }, 'Profile image updated successfully');
});

module.exports = { updateProfileImage };
```

### Example: Multiple Images Upload

#### Route Definition

```javascript
// Multiple files upload - field name: 'images', max 5 files
router.post(
    '/upload-gallery',
    protect,
    imageUpload.array('images', 5),
    handleUploadError,
    galleryController.uploadImages
);
```

#### Controller Implementation

```javascript
const uploadImages = catchAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return ApiResponse.badRequest(res, 'No images provided');
    }

    const imageUrls = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
    }));

    // Save imageUrls to database...

    ApiResponse.success(res, { images: imageUrls }, 'Images uploaded successfully');
});
```

### Example: Mixed Fields Upload

```javascript
// For multiple fields with different configurations
router.post(
    '/create-with-images',
    protect,
    taskImageUpload.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'screenshots', maxCount: 5 }
    ]),
    handleUploadError,
    taskController.createWithImages
);
```

### Custom Upload Configuration

If you need a custom configuration:

```javascript
const { createImageUpload } = require('../../middleware/upload.middleware');

// Custom upload for large files
const largeFileUpload = createImageUpload({
    folder: 'mentorbro/large-files',
    maxSize: 20 * 1024 * 1024, // 20MB
});

router.post('/upload-large', protect, largeFileUpload.single('file'), controller.uploadLarge);
```

## File Object Properties

When a file is uploaded, `req.file` (or `req.files`) contains:

```javascript
{
    fieldname: 'profileImage',         // Field name from form
    originalname: 'photo.jpg',           // Original filename
    encoding: '7bit',                    // Encoding type
    mimetype: 'image/jpeg',              // MIME type
    path: 'https://res.cloudinary.com/...', // Cloudinary URL (secure_url)
    size: 123456,                        // File size in bytes
    filename: 'image-name-123456789',    // Cloudinary public_id
}
```

## Deleting Images

### Delete Single Image

```javascript
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

// If you have the URL
const imageUrl = 'https://res.cloudinary.com/...';
const publicId = getPublicIdFromUrl(imageUrl);
await deleteImage(publicId);

// If you have the public ID directly
await deleteImage('mentorbro/profiles/image-name-123456789');
```

### Delete Multiple Images

```javascript
const { deleteMultipleImages } = require('../config/cloudinary');

const publicIds = [
    'mentorbro/images/img1-123',
    'mentorbro/images/img2-456',
];

await deleteMultipleImages(publicIds);
```

## Error Handling

The `handleUploadError` middleware handles common upload errors:

- **File size exceeded**: Returns 400 with "File size exceeds the maximum allowed limit"
- **Invalid file type**: Returns 400 with allowed types message
- **Other Multer errors**: Returns 400 with error message

## Supported File Types

By default, the following image types are supported:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`

## Frontend Integration

### Example HTML Form

```html
<form action="/api/v1/student/me/profile-image" method="POST" enctype="multipart/form-data">
    <input type="file" name="profileImage" accept="image/*" />
    <button type="submit">Upload</button>
</form>
```

### Example with Fetch API

```javascript
const formData = new FormData();
formData.append('profileImage', fileInput.files[0]);

const response = await fetch('/api/v1/student/me/profile-image', {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${token}`,
    },
    body: formData,
});

const result = await response.json();
```

### Example with Angular

```typescript
uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profileImage', file);

    return this.http.patch('/api/v1/student/me/profile-image', formData);
}
```
