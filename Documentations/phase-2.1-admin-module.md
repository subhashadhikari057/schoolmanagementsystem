# 📁 Phase 2.1 – Admin Management Module

**School Management System**  
**Tech Stack**: NestJS + Prisma + PostgreSQL + Zod + Role-based Guards

---

## 🎯 Overview

This phase introduces a fully secure and role-restricted **Admin Management Module**. Only users with the `SUPERADMIN` role can perform actions such as:

- Creating new admin users
- Updating existing admins
- Viewing all active admins
- Soft-deleting admin users

It also implements:

- Secure password hashing
- Optional auto-generation of admin passwords
- Soft delete with session revocation
- Audit logging for every action

---

## ✅ Features Implemented

- 🔐 Role-based Access Control using `IsAuthenticated` + `hasRole('SUPERADMIN')`
- 🧑‍💼 Create Admin with optional password (auto-generated if not provided)
- ✏️ Update Admin (partial fields allowed)
- 👁️ View all active admins
- 🗑️ Soft delete admins (with session revocation)
- 🧾 Audit Logging integrated for create, update, delete
- 🔒 Guard blocks access to soft-deleted/inactive users
- 🧪 Zod schema validation on both Create & Update DTOs

---

## 🧱 Folder Structure

```
src/
├── modules/
│   └── admin/
│       ├── application/
│       │   └── admin.service.ts      # Business logic
│       ├── dto/
│       │   └── admin.dto.ts          # Create + Update DTO (Zod)
│       └── infrastructure/
│           └── admin.controller.ts   # Route handlers
├── shared/
│   ├── auth/
│   │   ├── guards/
│   │   │   ├── is-authenticated.guard.ts
│   │   │   └── role.guard.ts
│   └── logger/
│       └── audit.service.ts
```

---

## 🛠 API Endpoints

All endpoints are protected by:

- ✅ `@UseGuards(IsAuthenticated, hasRole('SUPERADMIN'))`
- ✅ Cookies for authentication (`accessToken`)

### 🔐 POST `/api/admin`

Create new admin user

```json
// Request Body
{
  "fullName": "Admin User",
  "email": "admin2@example.com",
  "phone": "9800000000",
  "password": "securePass123" // Optional
}
```

Returns: `{ message: 'Admin created', id: 'uuid' }`  
If password is omitted, a temporary one is generated and returned.

---

### 👁️ GET `/api/admin`

Returns all active (non-deleted) admins  
Fields: `id`, `fullName`, `email`, `phone`, `createdAt`

---

### ✏️ PATCH `/api/admin/:id`

Update admin by ID

```json
// Request Body
{
  "fullName": "Updated Admin",
  "phone": "9812345678"
}
```

---

### 🗑️ DELETE `/api/admin/:id`

Soft delete admin (sets `isActive: false`, `deletedAt`) and revokes all sessions  
Returns: `{ message: 'Admin soft-deleted', id }`

---

## 🔒 Guards Used

- **`IsAuthenticated`** – Validates session + token + user status
- **`hasRole('SUPERADMIN')`** – Allows only superadmins to access admin endpoints

---

## 🧾 Audit Log Example

All actions (create, update, delete) generate audit records:

```json
{
  "action": "DELETE_ADMIN",
  "status": "SUCCESS",
  "module": "admin",
  "userId": "actor_user_id",
  "details": {
    "id": "deleted_admin_id"
  },
  "ipAddress": "...",
  "userAgent": "..."
}
```

---

## 🧼 Refactor: Cleaned Up Controller Using `@CurrentUser()` Decorator

To improve readability and remove repetitive logic in the AdminController, we introduced a custom `@CurrentUser()` decorator.

### 🔍 What It Does

Instead of accessing `req.user.id` and other request-level user metadata in every controller method, the decorator cleanly injects the authenticated user object directly into your route handler.

### 🛠️ How It Was Used

In the `AdminController`, all `@Req()` usages for accessing `req.user.id`, `req.ip`, and `user-agent` were replaced with:

```ts
@CurrentUser() user: CurrentUserType,
@Req() req: Request
```

This results in cleaner, more focused methods.

### ✅ Benefits

- ✨ Removes repetitive `req.user?.id` checks
- 🧼 Improves readability and modularity
- 🔐 Compatible with guards like `IsAuthenticated` and role guards

> ❗ Note: This was only applied in the Admin module. It's not required in `AuthController` since it handles login and refresh tokens manually without guards.

---

## 📌 Summary

The Admin module is now:

- 🔐 Secure (guarded, audited, RBAC)
- 🧩 Modular and well-isolated
- 💡 Ready for frontend integration

This concludes **Phase 2.1** of the backend.
