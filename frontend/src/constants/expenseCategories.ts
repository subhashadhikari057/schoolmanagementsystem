export type ExpenseCategory = {
  value: string;
  label: string;
};

// Shared expense/asset category options
export const expenseCategories: ExpenseCategory[] = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'transport', label: 'Transport' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];
