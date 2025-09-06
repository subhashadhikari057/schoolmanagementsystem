/**
 * Export utilities for generating Excel files
 */

import * as XLSX from 'xlsx';
import { ParentResponse } from '@/api/services/parent.service';

/**
 * Convert parent data to CSV format
 */
export const exportParentsToCSV = (parents: ParentResponse[]): string => {
  if (parents.length === 0) {
    return 'No data to export';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone',
    'Date of Birth',
    'Gender',
    'Occupation',
    'Work Place',
    'Work Phone',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Emergency Contact Relationship',
    'Address Street',
    'Address City',
    'Address State',
    'Address Pin Code',
    'Address Country',
    'Notes',
    'Special Instructions',
    'Children Count',
    'Children Details',
    'Created At',
    'Updated At',
  ];

  // Convert parents data to CSV rows
  const rows = parents.map(parent => {
    const profile = parent.profile || {};
    const emergencyContact = profile.emergencyContact || {};
    const address = profile.address || {};

    // Format children details
    const childrenDetails =
      parent.children
        ?.map(
          child =>
            `${child.fullName} (${child.relationship}) - Class: ${child.className || 'N/A'} - Roll: ${child.rollNumber || 'N/A'}`,
        )
        .join('; ') || '';

    return [
      parent.id,
      parent.fullName,
      parent.email,
      parent.phone,
      profile.dateOfBirth || '',
      profile.gender || '',
      profile.occupation || parent.occupation || '',
      profile.workPlace || '',
      profile.workPhone || '',
      emergencyContact.name || '',
      emergencyContact.phone || '',
      emergencyContact.relationship || '',
      address.street || '',
      address.city || '',
      address.state || '',
      address.pinCode || '',
      address.country || '',
      profile.notes || '',
      profile.specialInstructions || '',
      parent.children?.length || 0,
      childrenDetails,
      new Date(parent.createdAt).toLocaleDateString(),
      parent.updatedAt ? new Date(parent.updatedAt).toLocaleDateString() : '',
    ].map(field => `"${String(field).replace(/"/g, '""')}"`); // Escape quotes and wrap in quotes
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (
  csvContent: string,
  filename: string = 'parents_export.csv',
): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Export parents data to proper Excel format using XLSX library
 */
export const exportParentsToExcel = (parents: ParentResponse[]): void => {
  if (parents.length === 0) {
    return;
  }

  // Prepare data for Excel
  const excelData = parents.map(parent => {
    const profile = parent.profile || {};
    const emergencyContact = profile.emergencyContact || {};
    const address = profile.address || {};

    // Format children details
    const childrenDetails =
      parent.children
        ?.map(
          child =>
            `${child.fullName} (${child.relationship}) - Class: ${child.className || 'N/A'} - Roll: ${child.rollNumber || 'N/A'}`,
        )
        .join('; ') || '';

    return {
      ID: parent.id,
      'Full Name': parent.fullName,
      Email: parent.email,
      Phone: parent.phone,
      'Date of Birth': profile.dateOfBirth || '',
      Gender: profile.gender || '',
      Occupation: profile.occupation || parent.occupation || '',
      'Work Place': profile.workPlace || '',
      'Work Phone': profile.workPhone || '',
      'Emergency Contact Name': emergencyContact.name || '',
      'Emergency Contact Phone': emergencyContact.phone || '',
      'Emergency Contact Relationship': emergencyContact.relationship || '',
      'Address Street': address.street || '',
      'Address City': address.city || '',
      'Address State': address.state || '',
      'Address Pin Code': address.pinCode || '',
      'Address Country': address.country || '',
      Notes: profile.notes || '',
      'Special Instructions': profile.specialInstructions || '',
      'Children Count': parent.children?.length || 0,
      'Children Details': childrenDetails,
      'Created At': new Date(parent.createdAt).toLocaleDateString(),
      'Updated At': parent.updatedAt
        ? new Date(parent.updatedAt).toLocaleDateString()
        : '',
    };
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 15 }, // ID
    { wch: 20 }, // Full Name
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 12 }, // Date of Birth
    { wch: 10 }, // Gender
    { wch: 20 }, // Occupation
    { wch: 20 }, // Work Place
    { wch: 15 }, // Work Phone
    { wch: 20 }, // Emergency Contact Name
    { wch: 18 }, // Emergency Contact Phone
    { wch: 20 }, // Emergency Contact Relationship
    { wch: 25 }, // Address Street
    { wch: 15 }, // Address City
    { wch: 15 }, // Address State
    { wch: 12 }, // Address Pin Code
    { wch: 15 }, // Address Country
    { wch: 30 }, // Notes
    { wch: 30 }, // Special Instructions
    { wch: 12 }, // Children Count
    { wch: 50 }, // Children Details
    { wch: 12 }, // Created At
    { wch: 12 }, // Updated At
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Parents');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `parents_export_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
};

/**
 * Format parent data for display in export
 */
export const formatParentForExport = (parent: ParentResponse) => {
  const profile = parent.profile || {};
  const emergencyContact = profile.emergencyContact || {};
  const address = profile.address || {};

  return {
    ID: parent.id,
    'Full Name': parent.fullName,
    Email: parent.email,
    Phone: parent.phone,
    'Date of Birth': profile.dateOfBirth || 'N/A',
    Gender: profile.gender || 'N/A',
    Occupation: profile.occupation || parent.occupation || 'N/A',
    'Work Place': profile.workPlace || 'N/A',
    'Work Phone': profile.workPhone || 'N/A',
    'Emergency Contact': emergencyContact.name
      ? `${emergencyContact.name} (${emergencyContact.phone || 'No phone'}) - ${emergencyContact.relationship || 'Unknown'}`
      : 'N/A',
    Address: address.street
      ? `${address.street}, ${address.city || ''}, ${address.state || ''} ${address.pinCode || ''}, ${address.country || ''}`
          .replace(/,\s*,/g, ',')
          .replace(/,\s*$/, '')
      : 'N/A',
    Notes: profile.notes || 'N/A',
    'Special Instructions': profile.specialInstructions || 'N/A',
    Children:
      parent.children
        ?.map(
          child =>
            `${child.fullName} (${child.relationship}) - Class: ${child.className || 'N/A'} - Roll: ${child.rollNumber || 'N/A'}`,
        )
        .join('; ') || 'No children',
    'Created At': new Date(parent.createdAt).toLocaleString(),
    'Updated At': parent.updatedAt
      ? new Date(parent.updatedAt).toLocaleString()
      : 'N/A',
  };
};
