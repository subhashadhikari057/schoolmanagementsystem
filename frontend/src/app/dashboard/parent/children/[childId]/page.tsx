'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Avatar from '@/components/atoms/display/Avatar';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Link from 'next/link';

// Mock children data
const children = [
  {
    id: '1',
    name: 'Arjun Kumar Sharma',
    class: '10',
    section: 'A',
    rollNumber: '2024001',
    profilePic: '/uploads/students/profiles/arjun-sharma.jpg',
    dob: '2010-05-12',
    address: 'Kathmandu, Nepal',
    parent: 'Ram Sharma',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    class: '7',
    section: 'B',
    rollNumber: '2024012',
    profilePic: '/uploads/students/profiles/priya-sharma.jpg',
    dob: '2013-09-22',
    address: 'Kathmandu, Nepal',
    parent: 'Ram Sharma',
  },
];

export default function ChildProfilePage() {
  const params = useParams();
  const childId = params?.childId as string;
  const child = children.find(c => c.id === childId);

  if (!child) {
    return (
      <div className='p-8 text-center text-red-600 font-bold text-lg'>
        Child not found.
        <div className='mt-4'>
          <Link
            href='/dashboard/parent/children'
            className='text-blue-600 underline'
          >
            Back to My Children
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='p-8 w-full space-y-6'>
      <SectionTitle text='Child Profile' className='text-2xl font-bold mb-4' />
      <div className='flex items-center gap-6 bg-white rounded-xl shadow p-6'>
        <Avatar
          src={child.profilePic}
          name={child.name}
          className='w-20 h-20 rounded-full object-cover border'
        />
        <div>
          <div className='font-bold text-xl mb-1'>{child.name}</div>
          <div className='text-gray-700 mb-1'>
            Class {child.class}
            {child.section} • Roll No: {child.rollNumber}
          </div>
          <div className='text-gray-500 text-sm'>
            Date of Birth: {child.dob}
          </div>
          <div className='text-gray-500 text-sm'>Address: {child.address}</div>
          <div className='text-gray-500 text-sm'>Parent: {child.parent}</div>
        </div>
      </div>
      <div>
        <Link
          href='/dashboard/parent/children'
          className='text-blue-600 hover:underline font-medium'
        >
          ← Back to My Children
        </Link>
      </div>
    </div>
  );
}
