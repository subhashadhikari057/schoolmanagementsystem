# Template Publish/Unpublish Functionality

## Overview
The template publish/unpublish feature allows you to control which templates are available for ID card generation. Only published (ACTIVE) templates can be used to generate ID cards.

## How to Access Publish/Unpublish Buttons

### Location
Navigate to: **Dashboard → ID Card Generation & Management → Template Builder tab**

### Template States
Templates can have the following states:
- **DRAFT** (Yellow badge) - Template is not ready for use
- **Published** (Green badge) - Template is active and available for ID generation
- **INACTIVE** (Gray badge) - Template was published but has been unpublished

### Publish/Unpublish Buttons

#### For Draft Templates
- **Green "Publish Template" button** appears at the bottom of each template card
- Click to make the template available for ID card generation
- Changes status from DRAFT to ACTIVE (Published)

#### For Published Templates  
- **Orange "Unpublish Template" button** appears at the bottom of each template card
- Click to remove the template from active use
- Changes status from ACTIVE to INACTIVE
- Template cannot be used for new ID card generation

## Template Card Actions

Each template card now shows:
1. **Preview** - View template design
2. **Edit** - Modify template fields and design  
3. **Copy** - Duplicate template for modifications
4. **Delete** - Remove template permanently (only if not in use)
5. **Publish/Unpublish** - Toggle template availability

## Usage Workflow

### Making a Template Available
1. Create or edit a template in the Template Builder
2. Save the template (it will be in DRAFT status)
3. Click the green **"Publish Template"** button
4. Template is now available in the "Generate ID Cards" tab

### Removing a Template from Use
1. Find the published template (shows "Published" green badge)
2. Click the orange **"Unpublish Template"** button  
3. Template is no longer available for new ID card generation
4. Existing ID cards generated from this template remain valid

## Important Notes

### Template Validation
- Templates are automatically validated before publishing
- Must have required fields for the template type (Student/Teacher/Staff)
- Must have at least one field defined

### Default Templates
- Cannot unpublish default templates
- Must set another template as default before unpublishing

### Templates in Use
- Can unpublish templates even if they've been used to generate ID cards
- Existing generated ID cards remain valid and downloadable
- Only prevents new ID card generation using that template

### Permissions
- Only users with appropriate permissions can publish/unpublish templates
- Super Admin and authorized users can manage template status

## Visual Indicators

### Template Status Badges
- **Published** (Green) - Ready for ID generation
- **draft** (Yellow) - Not yet ready for use  
- **inactive** (Gray) - Previously published but now disabled

### Button Colors
- **Green button** = Publish action
- **Orange button** = Unpublish action

## Troubleshooting

### Button Not Showing
- Refresh the page
- Check user permissions
- Verify template data is loaded

### Cannot Publish Template
- Ensure template has required fields
- Check template validation status
- Verify template is not corrupted

### Cannot Unpublish Template
- Check if template is set as default
- Verify user has unpublish permissions
- Ensure template is currently published

## Best Practices

1. **Test Before Publishing** - Always preview and test templates before making them available
2. **Gradual Rollout** - Publish one template type at a time to test functionality
3. **Backup Templates** - Copy templates before major changes
4. **Monitor Usage** - Check template usage statistics before unpublishing
5. **Communication** - Inform users when templates will be unavailable