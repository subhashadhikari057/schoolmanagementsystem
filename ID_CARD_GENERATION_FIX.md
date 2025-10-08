# ID Card Generation Issue - Diagnosis & Solution

## Issue Summary
Individual ID card generation is not working when user clicks "Generate ID Card" button.

## Root Causes Identified

### 1. **Missing Toast Notifications**
- ✅ **FIXED**: Added `toast` import to `TemplateSelection.tsx`
- ✅ **FIXED**: Replaced browser `alert()` with proper toast notifications
- ✅ **FIXED**: Added detailed error messages with descriptions

### 2. **Potential Backend Connection Issues**
The frontend is calling `/api/id-card-generation/generate-individual` but needs to verify:
- Backend is running on correct port
- CORS is configured properly
- Authentication tokens are being sent

### 3. **Missing Error Feedback**
- ✅ **FIXED**: Added comprehensive error handling in `TemplateSelection.tsx`
- ✅ **FIXED**: Console logs for debugging
- ✅ **FIXED**: User-friendly error messages

## Changes Made

### File: `frontend/src/components/organisms/id-generation/TemplateSelection.tsx`

#### Added Toast Import
```typescript
import { toast } from 'sonner';
```

#### Enhanced handleGenerate Function
```typescript
const handleGenerate = async () => {
  if (!selectedTemplate || !expiryDate) {
    toast.error('Missing Required Information', {
      description: 'Please select a template and set an expiry date.',
    });
    return;
  }

  setIsGenerating(true);
  try {
    console.log('Starting ID card generation...', {
      personId: selectedPerson.id,
      personType: selectedPerson.type,
      templateId: selectedTemplate.id,
      expiryDate,
    });

    const result = await personSearchService.generateIndividualIDCard({
      personId: selectedPerson.id,
      personType: selectedPerson.type,
      templateId: selectedTemplate.id,
      expiryDate,
    });

    console.log('ID card generated successfully:', result);

    toast.success('ID Card Generated!', {
      description: `Successfully generated ID card for ${selectedPerson.name}`,
      duration: 4000,
    });

    await onGenerate(selectedPerson, selectedTemplate, expiryDate);
  } catch (error: any) {
    console.error('Error generating ID card:', error);
    
    const errorMessage = 
      error?.response?.data?.message || 
      error?.message || 
      'Failed to generate ID card';
    
    toast.error('Generation Failed', {
      description: errorMessage,
      duration: 6000,
    });
  } finally {
    setIsGenerating(false);
  }
};
```

### File: `frontend/src/app/dashboard/admin/academics/id-generation/page.tsx`

#### Replaced Alert with Toast
```typescript
const handleGenerateIDCard = async (
  person: Person,
  template: IDCardTemplate,
  expiryDate: string,
) => {
  try {
    console.log('Generating ID card:', { person, template, expiryDate });

    toast.success('ID Card Generated Successfully!', {
      description: `ID card for ${person.name} has been generated and is ready for download.`,
      duration: 5000,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Reset state
    setGenerationType(null);
    setSelectedPersonType(null);
    setSelectedPerson(null);
    setCurrentStep('type');
  } catch (error) {
    console.error('Error generating ID card:', error);
    toast.error('Failed to Generate ID Card', {
      description: error instanceof Error ? error.message : 'Please try again or contact support.',
      duration: 6000,
    });
  }
};
```

## How to Test

### 1. Check Backend is Running
```bash
cd backend
npm run start:dev
```

### 2. Check Frontend is Running
```bash
cd frontend
npm run dev
```

### 3. Test ID Card Generation Flow

1. Navigate to **ID Management** → **Generate ID Cards**
2. Click **Individual Generation**
3. Select person type (Student/Teacher/Staff)
4. Search and select a person
5. Select a template
6. Set expiry date
7. Click **Generate ID Card**

### 4. Check Browser Console
Open DevTools (F12) and check:
- **Console tab**: Look for error messages or API call logs
- **Network tab**: Check if `/api/id-card-generation/generate-individual` is being called
- **Status code**: Should be 200/201 for success

## Expected Behavior

### Success Flow:
1. ✅ User clicks "Generate ID Card"
2. ✅ Button shows loading spinner: "Generating..."
3. ✅ API call is made to backend
4. ✅ Success toast appears: "ID Card Generated!"
5. ✅ User is returned to generation type selection
6. ✅ Generated card appears in "Generated ID Cards" tab

### Error Flow:
1. ✅ User clicks "Generate ID Card"
2. ✅ Button shows loading spinner: "Generating..."
3. ✅ API call fails
4. ✅ Error toast appears with specific error message
5. ✅ Button returns to normal state
6. ✅ User can try again

## Common Errors & Solutions

### Error: "Template not found"
**Solution**: Make sure template exists and is ACTIVE
```sql
SELECT id, name, status FROM "IDCardTemplate" WHERE id = 'template-id';
UPDATE "IDCardTemplate" SET status = 'ACTIVE' WHERE id = 'template-id';
```

### Error: "Person not found"
**Solution**: Verify person exists in database
```sql
SELECT id, "fullName" FROM "User" WHERE id = 'user-id';
```

### Error: "Person already has an active ID card"
**Solution**: Check for existing active cards
```sql
SELECT * FROM "IDCard" 
WHERE "issuedForId" = 'user-id' 
AND "expiryDate" >= NOW();
```

### Error: "Template type does not match person type"
**Solution**: Use correct template for person type:
- Student → STUDENT template
- Teacher → TEACHER template  
- Staff → STAFF template

### Error: "CORS error" or "Network error"
**Solution**: Check backend CORS configuration in `main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});
```

## Next Steps

1. **Test the flow** with all changes applied
2. **Check console logs** for any errors
3. **Verify backend logs** for API call processing
4. **Check database** for generated ID card records

## Debugging Commands

```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check database for templates
psql -d school_db -c "SELECT id, name, type, status FROM \"IDCardTemplate\";"

# Check database for generated cards
psql -d school_db -c "SELECT id, \"issuedForId\", \"templateId\", \"expiryDate\" FROM \"IDCard\" ORDER BY \"createdAt\" DESC LIMIT 10;"
```

## Status
✅ All code changes applied
✅ Toast notifications implemented
✅ Error handling enhanced
✅ Console logging added
⏳ Waiting for testing confirmation
