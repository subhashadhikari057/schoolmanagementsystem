'use client';
import React, { useState, useEffect } from 'react';
import Avatar from '@/components/atoms/display/Avatar';
import { useAuth } from '@/hooks/useAuth';
import NoticesList from '../../../components/atoms/display/NoticesList';
import NotificationPanel from '@/components/organisms/dashboard/NotificationPanel';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { PageLoader } from '@/components/atoms/loading';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchParentAndChildren = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch parent by userId
        const parentRes = await fetch(`/api/parent/by-user/${user.id}`);
        const parentData = await parentRes.json();
        if (!parentData?.id) {
          setChildren([]);
          setLoading(false);
          return;
        }
        setParentId(parentData.id);

        // Step 2: Fetch children using parentId
        const childrenRes = await fetch(`/api/parent/${parentData.id}`);
        const childrenData = await childrenRes.json();
        setChildren(childrenData.children || []);
      } catch (err) {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };
    fetchParentAndChildren();
  }, [user?.id]);

  const notices = [
    {
      id: 'n1',
      title: 'School will be closed on Aug 30 for holiday',
      forClass: 'All',
    },
    { id: 'n2', title: 'Class 10A: Extra class on Aug 26', forClass: '10A' },
  ];

  const parentName = user?.full_name || user?.email || 'Parent';
  const parentEmail = user?.email || 'parent@email.com';
  const numChildren = children.length;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Parent Dashboard</h1>
        <p className='text-gray-600 text-base mt-1'>
          Comprehensive overview of your children's academic journey
        </p>
      </div>
      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='w-full space-y-6 mt-4'>
          {/* Stat Cards */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-6'>
            <div className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {numChildren}
              </div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                Children
              </div>
            </div>
            <div className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center'>
              <div className='text-2xl font-bold text-orange-500'>1</div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                Pending Requests
              </div>
            </div>
            <div className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center'>
              <div className='text-2xl font-bold text-green-600'>5</div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                School Notices
              </div>
            </div>
            <div className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center'>
              <div className='text-2xl font-bold text-purple-500'>3</div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                Upcoming Events
              </div>
            </div>
          </div>
          {/* Parent Info */}
          <div className='bg-blue-50 rounded-xl shadow p-6 mb-6'>
            <SectionTitle
              text='Parent Information'
              className='text-lg font-bold mb-2'
            />
            <div className='flex items-center gap-4'>
              <Avatar
                src='/uploads/parents/profiles/parent.jpg'
                name={parentName}
                className='w-12 h-12 rounded-full object-cover border'
              />
              <div>
                <div className='font-semibold text-gray-900'>{parentName}</div>
                <div className='text-gray-700'>
                  {parentEmail} • +91 98765 43210
                </div>
                <div className='text-gray-700'>Father • Science Olympiad</div>
              </div>
            </div>
          </div>
          {/* My Children List */}
          <div className='bg-white rounded-xl shadow p-6 mb-6'>
            <SectionTitle
              text={`My Children (${numChildren})`}
              className='text-lg font-bold mb-2'
            />
            <div className='flex flex-col gap-2'>
              {children.length === 0 ? (
                <div>No children linked.</div>
              ) : (
                children.map((child: any) => (
                  <div
                    key={child.id}
                    className='flex items-center gap-4 py-2 border-b last:border-b-0'
                  >
                    <Avatar
                      src={child.profilePic || ''}
                      name={child.name}
                      className='w-8 h-8 rounded-full object-cover border'
                    />
                    <div className='flex-1'>
                      <div className='font-semibold text-gray-900'>
                        {child.name}
                      </div>
                      <div className='text-gray-600 text-sm'>
                        Class {child.class} • Roll {child.rollNumber}
                      </div>
                    </div>
                    <a
                      href={`/dashboard/parent/children/${child.id}`}
                      className='text-blue-600 hover:underline text-xs font-medium'
                    >
                      View Details
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* School Notices */}
          <div className='bg-white rounded-xl shadow p-6 mb-6'>
            <SectionTitle
              text={`School Notices (${notices.length})`}
              className='text-lg font-bold mb-2'
            />
            <NoticesList notices={notices} />
          </div>
          {/* Leave Requests */}
          <div className='bg-white rounded-xl shadow p-6 mb-6'>
            <SectionTitle
              text="Children's Leave Requests"
              className='text-lg font-bold mb-2'
            />
            <NotificationPanel
              notifications={[
                {
                  id: 'lr1',
                  title: 'Raj Patel - Approved',
                  message: 'Family Event | 08/15/2025 - 08/16/2025',
                  time: 'Approved',
                  type: 'success',
                  isRead: true,
                },
                {
                  id: 'lr2',
                  title: 'Priya Patel - Pending',
                  message: 'Medical Appointment | 08/20/2025',
                  time: 'Pending',
                  type: 'warning',
                  isRead: false,
                },
              ]}
            />
          </div>
          {/* Quick Actions */}
          <div className='flex gap-4 mt-6'>
            <button className='px-4 py-2 rounded bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition'>
              Contact School
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
