# Teacher API Integration - Frontend to Backend Sync

## ✅ Implementation Summary

The teacher management system has been successfully synced between frontend and backend to support all fields from your `AddUserFormModal.tsx` form.

### 🔄 Changes Made

#### 1. Database Schema Updates (Prisma)

- ✅ Added missing personal fields: `dateOfBirth`, `gender`, `bloodGroup`, `address`
- ✅ Added professional fields: `employeeId`, `experienceYears`, `specialization`
- ✅ Added salary fields: `basicSalary`, `allowances`, `totalSalary`
- ✅ Added additional fields: `languagesKnown`, `certifications`, `previousExperience`, `isClassTeacher`
- ✅ All fields properly indexed for performance

#### 2. File Upload Infrastructure

- ✅ Created `file-upload.util.ts` with Multer configuration
- ✅ Added `FileController` to serve uploaded profile pictures
- ✅ Created upload directories: `/uploads/teachers/profiles/`
- ✅ Supports image files: jpg, jpeg, png, gif, webp (5MB limit)
- ✅ Profile pictures accessible via: `/api/v1/files/teachers/{filename}`

#### 3. DTOs Updated

- ✅ Restructured DTOs to match frontend form exactly:
  - `user`: firstName, lastName, email, phone, password
  - `personal`: dateOfBirth, gender, bloodGroup, address
  - `professional`: employeeId, joiningDate, experienceYears, highestQualification, specialization, designation, department
  - `subjects`: subjects[], isClassTeacher
  - `salary`: basicSalary, allowances, totalSalary
  - `additional`: languagesKnown[], certifications, previousExperience, bio, socialLinks

#### 4. Service Layer Updates

- ✅ Updated `TeacherService.create()` to handle all new fields
- ✅ Added profile picture upload support
- ✅ Updated validation for employeeId uniqueness
- ✅ Fixed `updateByAdmin()` and `updateSelf()` methods for nested DTO structure
- ✅ Proper subject assignment during teacher creation

#### 5. Controller Updates

- ✅ Added `@UseInterceptors(FileInterceptor)` for profile picture upload
- ✅ Updated to handle multipart form data with nested JSON parsing
- ✅ Added proper error handling for file uploads and validation

### 📡 API Endpoint

**POST** `/api/v1/teachers`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (Form Data):**

```javascript
{
  // JSON strings for nested data
  user: JSON.stringify({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@school.edu",
    phone: "+1234567890",
    password: "optional"
  }),

  personal: JSON.stringify({
    dateOfBirth: "1990-01-01",
    gender: "Male",
    bloodGroup: "A+",
    address: "123 Main St"
  }),

  professional: JSON.stringify({
    employeeId: "EMP001",
    joiningDate: "2024-01-01",
    experienceYears: 5,
    highestQualification: "Master's in Education",
    specialization: "Mathematics",
    designation: "Senior Teacher",
    department: "Mathematics"
  }),

  subjects: JSON.stringify({
    subjects: ["subject-uuid-1", "subject-uuid-2"],
    isClassTeacher: true
  }),

  salary: JSON.stringify({
    basicSalary: 50000,
    allowances: 5000,
    totalSalary: 55000
  }),

  additional: JSON.stringify({
    languagesKnown: ["English", "Hindi"],
    certifications: "B.Ed, M.Ed",
    previousExperience: "5 years at XYZ School",
    bio: "Experienced mathematics teacher",
    socialLinks: {
      linkedin: "https://linkedin.com/in/johndoe",
      twitter: "https://twitter.com/johndoe"
    }
  }),

  // File upload
  photo: [File object]
}
```

**Response:**

```json
{
  "message": "Teacher created successfully",
  "teacher": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john.doe@school.edu",
    "phone": "+1234567890",
    "employeeId": "EMP001",
    "profilePhotoUrl": "/api/v1/files/teachers/profile-123456789.jpg"
  },
  "temporaryPassword": "generatedPassword" // if no password provided
}
```

### 🔧 Frontend Integration

Your `AddUserFormModal.tsx` form is already perfectly structured! Just update the API call to send data as FormData:

```typescript
const formData = new FormData();

// Add JSON data as strings
formData.append(
  'user',
  JSON.stringify({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
  }),
);

formData.append(
  'personal',
  JSON.stringify({
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    bloodGroup: data.bloodGroup,
    address: data.address,
  }),
);

// ... add other sections similarly

// Add photo file
if (data.photo) {
  formData.append('photo', data.photo);
}

// Send to API
await fetch('/api/v1/teachers', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type - browser will set it with boundary for multipart
  },
  body: formData,
});
```

### 🎯 Next Steps

1. **Frontend**: Update your form submission to use the API endpoint
2. **Testing**: Test teacher creation with all fields and profile picture
3. **Validation**: Frontend validation should match backend Zod schemas
4. **Error Handling**: Handle specific error responses (email exists, etc.)

All backend infrastructure is ready and fully synced with your frontend form! 🚀
