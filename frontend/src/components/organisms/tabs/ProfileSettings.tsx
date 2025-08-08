'use client';

import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

const fields = [
  { label: 'Full Name' },
  { label: 'Email Address' },
  { label: 'Phone Number' },
  { label: 'Employee ID' },
  { label: 'Address', colSpan: 2 },
  { label: 'Department' },
  { label: 'Role' },
];

export default function ProfileSettings() {
  const baseButtonClass = 'p-1 px-2 rounded-lg shadow-sm cursor-pointer';

  return (
    <div className='w-full max-w-full mx-auto'>
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-6'>
        <div>
          <SectionTitle
            className='text-2xl font-semibold'
            text='Personal Information'
          />
          <Label className='text-sm text-muted-foreground'>
            Update your personal details and contact information
          </Label>
        </div>
        <div className='hidden sm:block h-[1px]  bg-border mt-4' />
        <div className='pt-4'>
          <form className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            {fields.map((field, index) => (
              <div
                key={index}
                className={field.colSpan === 2 ? 'md:col-span-2' : ''}
              >
                <LabeledInputField label={field.label} />
              </div>
            ))}
          </form>
          <div className='flex justify-end gap-4 mt-6'>
            <ReusableButton
              label='Cancel'
              className={`${baseButtonClass} border border-gray-300 hover:bg-gray-100`}
            />
            <ReusableButton
              label='Save Changes'
              className={`${baseButtonClass} bg-blue-500 text-foreground hover:bg-blue-400`}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
