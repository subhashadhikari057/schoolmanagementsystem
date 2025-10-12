# Admin Profile Photo Status

## 🚨 Current Limitation

**Admin users (SUPER_ADMIN, ADMIN) do NOT support profile photos.**

## 📋 Why?

Unlike other user roles, admins do not have a dedicated profile table in the database schema:

| Role | Has Profile Table? | Profile Photo Support |
|------|-------------------|----------------------|
| Student | ✅ `StudentProfile` | ✅ Supported |
| Teacher | ✅ `TeacherProfile` | ✅ Supported |
| Parent | ✅ `ParentProfile` | ✅ Supported |
| Staff | ✅ `StaffProfile` | ✅ Supported |
| Admin/Super Admin | ❌ None | ❌ **NOT Supported** |

## 🔍 Technical Details

### Database Schema
```prisma
// No Admin model exists in schema.prisma
// Admins are just Users with ADMIN or SUPER_ADMIN roles

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  fullName     String
  // ...
  roles        UserRole[]
  teacher      Teacher?
  student      Student?
  parent       Parent?
  staff        Staff?
  // ❌ NO admin profile relation
}
```

### Backend - ProfileService
The `ProfileService.getUserProfile()` method only retrieves profile data for:
- Teachers (`user.teacher.profile`)
- Students (`user.student.profile`)
- Parents (`user.parent.profile`)

**Admin profile data is NOT included.**

File: `backend/src/modules/auth/application/profile.service.ts`

### Frontend - Dropdown Component
The `Dropdown` component explicitly skips fetching profile photos for admin roles:

```typescript
case 'superadmin':
case 'admin':
  // Admins don't have profile tables - skip photo fetching
  break;
```

File: `frontend/src/components/molecules/interactive/Dropdown.tsx`

### Frontend - Avatar Component
The Avatar component will always show:
- **Red gradient background** for admins
- **Initials** from the user's full name
- **NO profile photo** (since `src` will be undefined)

## 🎯 Current Behavior

When an admin user logs in:
1. ✅ Authentication works correctly
2. ✅ Dashboard loads with proper permissions
3. ✅ Dropdown shows admin name and role
4. ⚠️ **Avatar shows initials only** (e.g., "SA" for Super Admin, "AK" for Admin Kartik)
5. ✅ No errors or warnings (this is expected behavior)

## 🛠️ How to Implement Admin Profile Photos

If you want to add profile photo support for admins, follow these steps:

### Step 1: Update Database Schema

Add an `AdminProfile` table to `backend/prisma/schema.prisma`:

```prisma
model Admin {
  id        String    @id @default(uuid())
  userId    String    @unique
  user      User      @relation(fields: [userId], references: [id])
  profile   AdminProfile?
  // other admin-specific fields
  createdAt DateTime  @default(now())
  updatedAt DateTime?
  deletedAt DateTime?
}

model AdminProfile {
  id              String   @id @default(uuid())
  adminId         String   @unique
  admin           Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  profilePhotoUrl String?
  // other profile fields
  createdAt       DateTime @default(now())
  updatedAt       DateTime?
}
```

Then run:
```bash
npx prisma migrate dev --name add-admin-profile
```

### Step 2: Update ProfileService

In `backend/src/modules/auth/application/profile.service.ts`, add admin profile retrieval:

```typescript
async getUserProfile(userId: string): Promise<UserProfile> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: true } },
      teacher: { include: { profile: true } },
      student: { include: { profile: true, class: true } },
      parent: { include: { profile: true } },
      admin: { include: { profile: true } }, // ✅ ADD THIS
    },
  });

  // ... existing code ...

  // ✅ ADD ADMIN PROFILE DATA
  if (user.admin) {
    profile.adminData = {
      profile: user.admin.profile,
    };
  }

  return profile;
}
```

### Step 3: Add Admin Profile Upload

Create admin profile photo upload functionality similar to teacher/student upload:
- Add file upload in admin creation form
- Add file upload in admin edit modal
- Use the existing file upload service

### Step 4: Update Frontend Services

Update `frontend/src/components/molecules/interactive/Dropdown.tsx`:

```typescript
case 'superadmin':
case 'admin':
  try {
    // Fetch admin profile from new endpoint
    const adminResponse = await adminService.getAdminByUserId(userId);
    profileData = adminResponse.data;
  } catch (error) {
    // Silent fail
  }
  break;
```

### Step 5: Test

1. Upload admin profile photo
2. Verify photo appears in navbar dropdown
3. Verify photo appears in profile modal
4. Verify photo appears in admin list (if applicable)

## 🐛 Build Output Cleanup

The excessive console logs from Avatar component have been removed:

**Before:**
```
Avatar [unknown]: { src: '...', name: '...', ... }
Avatar: Original src: http://localhost:8080/api/v1/files/...
Avatar: Converting backend URL to proxy URL: ...
Avatar: Image loaded successfully for URL: ...
```

**After:**
```
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (78/78)
```

## 📚 Related Files

### Frontend
- `frontend/src/components/atoms/display/Avatar.tsx` - Avatar component with role-based gradients
- `frontend/src/components/molecules/interactive/Dropdown.tsx` - Profile photo fetching logic
- `frontend/src/components/organisms/modals/UserProfileModal.tsx` - User profile display

### Backend
- `backend/src/modules/auth/application/profile.service.ts` - Profile data retrieval
- `backend/prisma/schema.prisma` - Database schema (missing AdminProfile)
- `backend/src/modules/admin/application/admin.service.ts` - Admin CRUD operations

## ✅ Conclusion

**This is NOT a bug!** Admin profile photos are simply not implemented in the current system architecture. Admins will always show initials until the AdminProfile table and related functionality are added.

The build output is now clean with all debug logs removed from the Avatar component.
