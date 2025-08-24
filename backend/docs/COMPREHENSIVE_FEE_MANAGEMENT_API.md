# Fee Management System API Reference

## Overview

The School Management System's Fee Management module provides a comprehensive solution for handling fee structures, scholarships, and charges. This document covers only the implemented and working endpoints.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Fee Structure Management](#fee-structure-management)
3. [Scholarship Management](#scholarship-management)
4. [Charge Management](#charge-management)
5. [Student Fee Calculations](#student-fee-calculations)
6. [Student Lookup](#student-lookup)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)

## Authentication & Authorization

All endpoints require JWT authentication:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Role-based Access Control

| Action                   | Required Roles                       |
| ------------------------ | ------------------------------------ |
| Fee Structure Management | `SUPER_ADMIN`, `ADMIN`               |
| Scholarship Management   | `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT` |
| Charge Management        | `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT` |
| Fee Calculations         | `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT` |
| Student Lookup           | Users with finance permissions       |

## Fee Structure Management

Base path: `/api/v1/fees/structures`

### Create Fee Structure

```http
POST /api/v1/fees/structures
```

**Request Body:**

```json
{
  "name": "Grade 1 Fees 2024-25",
  "academicYear": "2024-25",
  "effectiveFrom": "2024-04-01",
  "classIds": ["class-1-id"],
  "items": [
    {
      "name": "Tuition Fee",
      "amount": 25000,
      "category": "TUITION"
    },
    {
      "name": "Transport Fee",
      "amount": 5000,
      "category": "TRANSPORT"
    }
  ]
}
```

### List Fee Structures

```http
GET /api/v1/fees/structures/list
```

**Query Parameters:**

- `classId` (string, optional): Filter by class ID
- `academicYear` (string, optional): Filter by academic year
- `page` (number, optional): Page number for pagination
- `pageSize` (number, optional): Number of items per page

### Get Fee Structure History

```http
GET /api/v1/fees/structures/:id/history
```

Returns version history for a specific fee structure.

### Revise Fee Structure

```http
POST /api/v1/fees/structures/:id/revise
```

Creates a new version of an existing fee structure.

### Update Fee Structure Status

```http
PATCH /api/v1/fees/structures/:id/status/:status
```

**Status values:** `ACTIVE`, `ARCHIVED`, `DRAFT`

## Scholarship Management

Base path: `/api/v1/fees/scholarships`

### Create Scholarship

```http
POST /api/v1/fees/scholarships
```

**Request Body:**

```json
{
  "name": "Merit Scholarship",
  "type": "MERIT",
  "description": "For students with 90%+ marks",
  "valueType": "PERCENTAGE",
  "value": 20
}
```

**Scholarship Types:** `MERIT`, `NEED_BASED`, `SPORTS`, `OTHER`
**Value Types:** `PERCENTAGE`, `FIXED`

### List Scholarships

```http
GET /api/v1/fees/scholarships
GET /api/v1/fees/scholarships/list
```

**Query Parameters:**

- `includeInactive` (boolean): Include deactivated scholarships

### Get Scholarship Details

```http
GET /api/v1/fees/scholarships/:id
```

### Update Scholarship

```http
PUT /api/v1/fees/scholarships/:id
```

### Deactivate/Reactivate Scholarship

```http
PUT /api/v1/fees/scholarships/:id/deactivate
PUT /api/v1/fees/scholarships/:id/reactivate
```

### Delete Scholarship

```http
DELETE /api/v1/fees/scholarships/:id
```

### Assign Scholarship to Students

```http
POST /api/v1/fees/scholarships/assign
```

**Request Body:**

```json
{
  "scholarshipId": "scholarship-id",
  "studentIds": ["student-1", "student-2"],
  "effectiveFrom": "2024-04-01",
  "expiresAt": "2025-03-31"
}
```

### Bulk Assign Scholarships

```http
POST /api/v1/fees/scholarships/bulk-assign
```

### Get Student's Scholarships

```http
GET /api/v1/fees/scholarships/students/:studentId
```

### Remove Scholarship Assignment

```http
DELETE /api/v1/fees/scholarships/assignments/:assignmentId
```

### Calculate Scholarship Amount

```http
POST /api/v1/fees/scholarships/calculate
```

## Charge Management

Base path: `/api/v1/fees/charges`

### Create Charge

```http
POST /api/v1/fees/charges
```

**Request Body:**

```json
{
  "name": "Late Fee Penalty",
  "description": "Penalty for late payment",
  "type": "FINE",
  "valueType": "FIXED",
  "value": 500,
  "category": "PENALTY",
  "isRecurring": false
}
```

### List Charges

```http
GET /api/v1/fees/charges
GET /api/v1/fees/charges/list
```

**Query Parameters:**

- `includeInactive` (boolean): Include deactivated charges

### Get Charge Details

```http
GET /api/v1/fees/charges/:id
```

### Update Charge

```http
PUT /api/v1/fees/charges/:id
```

### Deactivate/Reactivate Charge

```http
PUT /api/v1/fees/charges/:id/deactivate
PUT /api/v1/fees/charges/:id/reactivate
```

### Apply Charge to Students

```http
POST /api/v1/fees/charges/apply
```

**Request Body:**

```json
{
  "chargeId": "charge-id",
  "studentIds": ["student-1", "student-2"],
  "appliedMonth": "2024-04",
  "reason": "Late payment"
}
```

### Bulk Apply Charges

```http
POST /api/v1/fees/charges/bulk-apply
```

### Get Student's Charges

```http
GET /api/v1/fees/charges/students/:studentId
```

### Remove Charge Assignment

```http
DELETE /api/v1/fees/charges/assignments/:assignmentId
```

### Calculate Charge Amount

```http
POST /api/v1/fees/charges/calculate
```

### Get Class Charges for Month

```http
GET /api/v1/fees/charges/class/:classId/month/:month
```

## Student Fee Calculations

### Compute Monthly Fees

```http
POST /api/v1/fees/compute/month
```

**Request Body:**

```json
{
  "month": "2024-04",
  "classIds": ["class-1-id"],
  "studentIds": ["student-1-id"]
}
```

Calculates fees including base fees, applied scholarships, and charges for specified students and month.

## Student Fee API

Base path: `/api/student-fees`

### Get Current Student Fees

```http
GET /api/student-fees/:studentId/current
```

Returns current month fee calculations for a specific student.

### Get Student Fee History

```http
GET /api/student-fees/:studentId/history
```

**Query Parameters:**

- `from` (string): Start date (YYYY-MM-DD)
- `to` (string): End date (YYYY-MM-DD)
- `page` (number): Page number
- `pageSize` (number): Items per page

### Get Student Monthly Fees

```http
GET /api/student-fees/:studentId/month/:month
```

### Get Class Summary for Month

```http
GET /api/student-fees/class/:classId/month/:month
```

## Student Lookup

### Search Students

```http
GET /api/v1/fees/students/search
```

**Query Parameters:**

- `q` (string): Search query (name, roll number, email)
- `limit` (number): Maximum results (default: 10, max: 50)

Returns student information for fee assignment operations.

## Data Models

### Fee Structure

```typescript
interface FeeStructure {
  id: string;
  name: string;
  academicYear: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  effectiveFrom: string;
  classId: string;
  items: FeeStructureItem[];
  totalAnnual: number;
  latestVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface FeeStructureItem {
  name: string;
  amount: number;
  category: string;
}
```

### Scholarship

```typescript
interface Scholarship {
  id: string;
  name: string;
  type: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
  description?: string;
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Charge

```typescript
interface Charge {
  id: string;
  name: string;
  description?: string;
  type: string;
  valueType: 'FIXED';
  value: number;
  category: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Student Assignment

```typescript
interface StudentScholarshipAssignment {
  id: string;
  scholarshipId: string;
  studentId: string;
  effectiveFrom: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudentChargeAssignment {
  id: string;
  chargeId: string;
  studentId: string;
  appliedMonth: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (invalid or missing JWT token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate assignments, overlapping dates)
- `500` - Internal Server Error

### Validation Errors

For validation failures, additional details are provided:

```json
{
  "statusCode": 400,
  "message": "Request validation failed",
  "validationErrors": [
    {
      "path": "name",
      "message": "Name is required"
    },
    {
      "path": "value",
      "message": "Value must be positive"
    }
  ]
}
```

## Usage Examples

### Creating a Fee Structure with Multiple Classes

```javascript
const response = await fetch('/api/v1/fees/structures', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Grade 1-5 Fees 2024-25',
    academicYear: '2024-25',
    effectiveFrom: '2024-04-01',
    classIds: ['class-1', 'class-2', 'class-3'],
    items: [
      { name: 'Tuition Fee', amount: 25000, category: 'TUITION' },
      { name: 'Transport Fee', amount: 5000, category: 'TRANSPORT' },
    ],
  }),
});
```

### Assigning Merit Scholarship to Multiple Students

```javascript
await fetch('/api/v1/fees/scholarships/bulk-assign', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    scholarshipId: 'merit-scholarship-id',
    studentIds: ['student-1', 'student-2', 'student-3'],
    effectiveFrom: '2024-04-01',
    expiresAt: '2025-03-31',
  }),
});
```

### Computing Monthly Fees for a Class

```javascript
const feeCalculation = await fetch('/api/v1/fees/compute/month', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    month: '2024-04',
    classIds: ['class-1-id'],
  }),
});
```

---

_This API reference covers all currently implemented and working endpoints in the Fee Management System. The system provides comprehensive functionality for managing fee structures, scholarships, charges, and fee calculations._
