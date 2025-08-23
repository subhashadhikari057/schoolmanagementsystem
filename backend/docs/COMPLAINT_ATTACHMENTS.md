# Complaint Attachments

This document describes the file attachment functionality for the complaint module.

## Supported File Types

The complaint attachment system supports the following file types:

### Images

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Documents

- PDF (.pdf)
- Microsoft Word (.doc, .docx)

## File Size Limits

- **Maximum file size**: 10MB per file
- **Maximum files per upload**: 5 files
- **Total upload limit**: 50MB per complaint

## API Endpoints

### Upload Attachments

```
POST /api/v1/complaints/:id/attachments
```

**Headers:**

- `Content-Type: multipart/form-data`
- `Authorization: Bearer <token>`

**Body:**

- `attachments`: Array of files (max 5)

**Response:**

```json
{
  "message": "2 attachment(s) uploaded successfully",
  "attachments": [
    {
      "id": "uuid",
      "complaintId": "complaint-uuid",
      "filename": "attachment-1234567890-123456789.pdf",
      "originalName": "evidence.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "url": "http://localhost:8080/api/v1/files/complaints/attachment-1234567890-123456789.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Attachments

```
GET /api/v1/complaints/:id/attachments
```

**Response:**

```json
{
  "message": "Attachments retrieved",
  "attachments": [
    {
      "id": "uuid",
      "complaintId": "complaint-uuid",
      "filename": "attachment-1234567890-123456789.pdf",
      "originalName": "evidence.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "url": "http://localhost:8080/api/v1/files/complaints/attachment-1234567890-123456789.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Delete Attachment

```
DELETE /api/v1/complaints/:id/attachments/:attachmentId
```

**Response:**

```json
{
  "message": "Attachment deleted successfully"
}
```

## Access Control

### Upload Permissions

- **Admins**: Can upload attachments to any complaint
- **Complainant**: Can upload attachments to their own complaints
- **Assigned Handler**: Can upload attachments to assigned complaints
- **Recipient**: Can upload attachments to complaints where they are the recipient

### View Permissions

- **Admins**: Can view attachments for any complaint
- **Complainant**: Can view attachments for their own complaints
- **Assigned Handler**: Can view attachments for assigned complaints
- **Recipient**: Can view attachments for complaints where they are the recipient

### Delete Permissions

- **Admins**: Can delete any attachment
- **Complainant**: Can delete attachments from their own complaints
- **Assigned Handler**: Can delete attachments from assigned complaints

## File Storage

Files are stored in the following directory structure:

```
uploads/
└── complaints/
    └── attachments/
        ├── attachment-1234567890-123456789.pdf
        ├── attachment-1234567890-123456790.jpg
        └── ...
```

## Security Features

1. **File Type Validation**: Only allowed MIME types are accepted
2. **File Size Limits**: Prevents large file uploads
3. **Access Control**: Role-based permissions for all operations
4. **Audit Logging**: All attachment operations are logged
5. **Directory Traversal Protection**: File paths are validated
6. **Unique Filenames**: Generated to prevent conflicts

## Error Handling

### Common Error Responses

**File Type Not Supported:**

```json
{
  "statusCode": 400,
  "message": "File evidence.txt has unsupported type. Allowed types: images (jpg, jpeg, png, gif, webp), PDF, DOC, DOCX"
}
```

**File Too Large:**

```json
{
  "statusCode": 400,
  "message": "File large-document.pdf is too large. Maximum size is 10MB"
}
```

**Access Denied:**

```json
{
  "statusCode": 403,
  "message": "You do not have permission to upload attachments to this complaint"
}
```

**Complaint Not Found:**

```json
{
  "statusCode": 404,
  "message": "Complaint not found"
}
```

## Usage Examples

### Frontend Implementation

```javascript
// Upload attachments
const formData = new FormData();
files.forEach(file => {
  formData.append('attachments', file);
});

const response = await fetch(`/api/v1/complaints/${complaintId}/attachments`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

// Get attachments
const attachments = await fetch(
  `/api/v1/complaints/${complaintId}/attachments`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

// Delete attachment
await fetch(`/api/v1/complaints/${complaintId}/attachments/${attachmentId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### cURL Examples

**Upload attachments:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "attachments=@evidence.pdf" \
  -F "attachments=@screenshot.jpg" \
  http://localhost:8080/api/v1/complaints/123/attachments
```

**Get attachments:**

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/complaints/123/attachments
```

**Delete attachment:**

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/complaints/123/attachments/456
```

## Integration with Complaint Responses

Attachments are automatically included when fetching complaint details:

```json
{
  "id": "complaint-uuid",
  "title": "Complaint Title",
  "description": "Complaint description",
  "attachments": [
    {
      "id": "attachment-uuid",
      "filename": "attachment-1234567890-123456789.pdf",
      "originalName": "evidence.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "url": "http://localhost:8080/api/v1/files/complaints/attachment-1234567890-123456789.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "responses": [...],
  "complainant": {...},
  "recipient": {...},
  "assignedTo": {...}
}
```
