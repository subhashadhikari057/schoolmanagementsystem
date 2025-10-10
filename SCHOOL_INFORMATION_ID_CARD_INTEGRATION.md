# School Information Integration with ID Card Generation

## Overview
This feature integrates the school information configured in the system settings with ID card generation, allowing school details (name, logo, address, etc.) to be automatically populated on ID cards.

## Features Implemented

### 1. Backend API Integration
- **Endpoint**: `GET /api/id-card-templates/school-information`
- **Purpose**: Fetch school information for ID card template building
- **Returns**: School data with available fields for template integration

### 2. School Information Fields Available for ID Cards
The following school information fields can be used in ID card templates:

- **School Name** (`schoolName`) - The official name of the school
- **School Code** (`schoolCode`) - Unique identifier/code for the school
- **School Logo** (`schoolLogo`) - School logo image
- **School Address** (`schoolAddress`) - Complete address of the school
- **School Website** (`schoolWebsite`) - School's official website URL
- **School Email** (`schoolEmail`) - Primary contact email
- **School Phone** (`schoolPhone`) - Primary contact phone number
- **Established Year** (`establishedYear`) - Year the school was established

### 3. Template Builder Integration

#### Quick Start Templates
- Pre-designed templates now automatically populate school information
- When a quick start template is selected, school fields are auto-filled with actual data
- Sample templates include school logo, name, and address placeholders

#### Custom Template Builder
- New **School Information** section in the Layout tab
- Quick-add buttons for common school information fields:
  - School Name (pre-filled with actual name)
  - School Logo (pre-filled with actual logo if available)
  - School Address (pre-filled with actual address)
  - School Website (if configured)
  - School Phone (if configured)

### 4. ID Card Generation
- School information fields are automatically populated during PDF generation
- Static school data is embedded directly into the generated ID cards
- School logo is properly displayed on generated cards

## How to Use

### Setting up School Information
1. Navigate to **Settings > System Settings**
2. Configure your school information:
   - School Name (required)
   - School Code (required)
   - School Address (required)
   - Upload School Logo (recommended)
   - Add contact information (optional)

### Creating Templates with School Information

#### Using Quick Start Templates
1. Go to **ID Generation > Template Builder**
2. Select **Quick Start** tab
3. Choose any pre-designed template
4. School information will be automatically populated from your settings

#### Using Custom Builder
1. Go to **ID Generation > Template Builder**
2. Select **Layout** tab
3. Look for the **📚 School Information** section (appears when school info is configured)
4. Click on any school field button to add it to your template
5. Fields are pre-positioned and styled appropriately

### Generating ID Cards
1. Go to **ID Generation > Generate ID Cards**
2. Select Individual or Bulk generation
3. Choose a template that includes school information fields
4. Generate the ID card
5. School information will appear on the final generated PDF

## Technical Implementation

### Data Flow
1. School information is stored in the `schoolInformation` table
2. Template builder fetches school data via API
3. Templates store school fields as static content (not database references)
4. PDF generation includes school information processing
5. Final ID cards display actual school data

### Template Field Types
- **Static Fields**: School information is stored as static text/images in templates
- **Database Fields**: Personal information (name, ID, photo) comes from user database
- **Hybrid Approach**: Templates can mix school static data with personal database data

### Automatic Population
- School fields are automatically detected and populated
- Fallback to placeholder text if school information is not configured
- No manual data entry required for school information

## Benefits

1. **Consistency**: All ID cards show the same school information
2. **Efficiency**: No need to manually enter school details for each template
3. **Accuracy**: School information is centrally managed and always current
4. **Professional**: ID cards include proper school branding and contact information
5. **Flexibility**: School information can be easily updated from one location

## Configuration Requirements

### Minimum Required Setup
- School Name must be configured
- School Code must be configured
- School Address must be configured

### Recommended Setup
- Upload school logo for professional appearance
- Add contact information (phone, email, website)
- Set established year for official documentation

## Future Enhancements

Potential future improvements could include:
- Multiple logo support (color/monochrome)
- School motto and vision integration
- Department-specific information
- Multi-language school information
- Conditional school information based on ID card type

## Troubleshooting

### School Information Not Appearing
1. Verify school information is configured in Settings > System Settings
2. Check that school information fields are added to the template
3. Ensure template uses static data source for school fields

### Logo Not Displaying
1. Confirm logo is uploaded in school settings
2. Check image file format (JPG, PNG, GIF supported)
3. Verify image file size (under 2MB recommended)

### Template Not Loading School Data
1. Refresh the template builder page
2. Check browser console for API errors
3. Verify user has appropriate permissions to view school information