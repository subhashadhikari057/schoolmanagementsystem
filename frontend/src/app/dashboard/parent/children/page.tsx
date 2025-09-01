'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { Button } from '@/components/ui/button';
import ChildSwitcher from '@/components/atoms/display/ChildSwitcher';
import Avatar from '@/components/atoms/display/Avatar';
import ChildInfoCard from '@/components/atoms/display/ChildInfoCard';
import ChildSummaryCards from '@/components/atoms/display/ChildSummaryCards';
import NoticesList from '@/components/atoms/display/NoticesList';
import UpcomingEventsPanel from '@/components/organisms/dashboard/UpcomingEventsPanel';
import { PageLoader } from '@/components/atoms/loading';
import { parentService } from '@/api/services/parent.service';
import { useAuth } from '@/hooks/useAuth';

// Mock children data
const children = [
  {
    id: '1',
    name: 'Arjun Kumar Sharma',
    class: '10',
    section: 'A',
    rollNumber: '2024001',
    profilePic: '/uploads/students/profiles/arjun-sharma.jpg',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    class: '7',
    section: 'B',
    rollNumber: '2024012',
    profilePic: '/uploads/students/profiles/priya-sharma.jpg',
  },
];

const DEFAULT_CHILD_KEY = 'parent_default_child';

export default function MyChildrenPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [realChildren, setRealChildren] = useState(children); // Start with mock data as fallback

  // Load default child from localStorage
  const [activeChildId, setActiveChildId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(DEFAULT_CHILD_KEY) || children[0].id;
    }
    return children[0].id;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEFAULT_CHILD_KEY, activeChildId);
    }
  }, [activeChildId]);

  // Fetch real children data from API
  useEffect(() => {
    const fetchChildrenData = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching parent data for user:', user.id);

        // Get current parent's profile using the new /me endpoint
        console.log('Getting parent profile for user:', user.id);
        const parentRes = await parentService.getMyProfile();
        console.log('Parent profile response:', parentRes);

        if (!parentRes.success || !parentRes.data) {
          console.log('No parent profile found, using mock data');
          setLoading(false);
          return;
        }

        const parentData = parentRes.data;
        console.log('Parent data:', parentData);

        // Children data is already included in the parent response
        if (parentData.children && parentData.children.length > 0) {
          console.log(
            'Raw children data from parent response:',
            parentData.children,
          );

          // Transform children data to match expected format
          const transformedChildren = parentData.children.map((child: any) => {
            console.log('Processing child:', child);
            return {
              id: child.studentId || child.id,
              name: child.fullName || 'Unknown',
              class: child.className?.split('-')[0] || child.class?.grade || '',
              section:
                child.className?.split('-')[1] || child.class?.section || '',
              rollNumber: child.rollNumber || 'N/A',
              profilePic: child.profilePhotoUrl || '',
            };
          });

          console.log('Transformed children:', transformedChildren);
          setRealChildren(transformedChildren);

          // Set active child if none is selected and we have children
          if (!activeChildId && transformedChildren.length > 0) {
            setActiveChildId(transformedChildren[0].id);
          }
        } else {
          console.log(
            'No children data found in parent response, using mock data',
          );
        }
      } catch (error) {
        console.error('Error fetching children data:', error);
        console.log('Using mock data as fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchChildrenData();
  }, [user?.id, activeChildId]);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  const setDefaultChild = (id: string) => {
    setActiveChildId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEFAULT_CHILD_KEY, id);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='p-6 space-y-6'>
      <SectionTitle text='My Children' className='text-xl font-bold mb-4' />
      {/* Child Switcher using dropdown */}
      <ChildSwitcher
        children={realChildren}
        activeChildId={activeChildId}
        setActiveChildId={setActiveChildId}
      />

      {/* Selected child's info using atomic components */}
      {(() => {
        const child = realChildren.find(c => c.id === activeChildId);
        if (!child) return null;
        // Dynamic data per child
        const childData: {
          [key: string]: {
            stats: {
              attendance: number;
              dueFees: number;
              upcomingAssignments: number;
              nextExam: string;
            };
            assignments: Array<{ id: string; title: string; status: string }>;
            grades: Array<{ subject: string; value: string }>;
            events: Array<{
              id: string;
              title: string;
              date: string;
              time: string;
              location: string;
              status: string;
            }>;
            notices: Array<{
              id: string;
              title: string;
              forClass: string;
              date: string;
            }>;
          };
        } = {
          '1': {
            stats: {
              attendance: 94,
              dueFees: 3500,
              upcomingAssignments: 3,
              nextExam: '1',
            },
            assignments: [
              { id: 'a1', title: 'Math Assignment', status: 'pending' },
              { id: 'a2', title: 'Science Project', status: 'pending' },
            ],
            grades: [
              { subject: 'Science', value: '87%' },
              { subject: 'English', value: '91%' },
              { subject: 'Math', value: '83%' },
            ],
            events: [
              {
                id: 'e1',
                title: 'Parent-Teacher Meeting',
                date: '2025-08-23',
                time: '09:00 AM',
                location: 'Main Auditorium',
                status: 'Scheduled',
              },
              {
                id: 'e2',
                title: 'Science Fair',
                date: '2025-09-15',
                time: '10:00 AM',
                location: 'Science Lab',
                status: 'Scheduled',
              },
            ],
            notices: [
              {
                id: 'n1',
                title: 'School Holiday - Independence Day',
                forClass: 'All',
                date: 'Aug 15',
              },
              {
                id: 'n2',
                title: 'Parent-Teacher Meeting Scheduled',
                forClass: 'All',
                date: 'Aug 23',
              },
              {
                id: 'n3',
                title: 'New Cafeteria Menu',
                forClass: 'All',
                date: 'Aug 10',
              },
            ],
          },
          '2': {
            stats: {
              attendance: 89,
              dueFees: 1500,
              upcomingAssignments: 2,
              nextExam: '2',
            },
            assignments: [
              { id: 'a3', title: 'English Essay', status: 'pending' },
              { id: 'a4', title: 'History Project', status: 'pending' },
            ],
            grades: [
              { subject: 'Science', value: '78%' },
              { subject: 'English', value: '88%' },
              { subject: 'Math', value: '80%' },
            ],
            events: [
              {
                id: 'e3',
                title: 'Parent-Teacher Meeting',
                date: '2025-08-23',
                time: '09:00 AM',
                location: 'Main Auditorium',
                status: 'Scheduled',
              },
              {
                id: 'e4',
                title: 'Art Competition',
                date: '2025-09-20',
                time: '11:00 AM',
                location: 'Art Room',
                status: 'Scheduled',
              },
            ],
            notices: [
              {
                id: 'n4',
                title: 'School Holiday - Independence Day',
                forClass: 'All',
                date: 'Aug 15',
              },
              {
                id: 'n5',
                title: 'Parent-Teacher Meeting Scheduled',
                forClass: 'All',
                date: 'Aug 23',
              },
              {
                id: 'n6',
                title: 'New Cafeteria Menu',
                forClass: 'All',
                date: 'Aug 10',
              },
            ],
          },
        };
        const data = childData[child.id] || {
          stats: {
            attendance: 85,
            dueFees: 2000,
            upcomingAssignments: 2,
            nextExam: '1',
          },
          assignments: [
            { id: 'a1', title: 'Math Assignment', status: 'pending' },
            { id: 'a2', title: 'Science Project', status: 'pending' },
          ],
          grades: [
            { subject: 'Science', value: '85%' },
            { subject: 'English', value: '90%' },
            { subject: 'Math', value: '82%' },
          ],
          events: [
            {
              id: 'e1',
              title: 'Parent-Teacher Meeting',
              date: '2025-08-23',
              time: '09:00 AM',
              location: 'Main Auditorium',
              status: 'Scheduled',
            },
            {
              id: 'e2',
              title: 'Science Fair',
              date: '2025-09-15',
              time: '10:00 AM',
              location: 'Science Lab',
              status: 'Scheduled',
            },
          ],
          notices: [
            {
              id: 'n1',
              title: 'School Holiday - Independence Day',
              forClass: 'All',
              date: 'Aug 15',
            },
            {
              id: 'n2',
              title: 'Parent-Teacher Meeting Scheduled',
              forClass: 'All',
              date: 'Aug 23',
            },
            {
              id: 'n3',
              title: 'New Cafeteria Menu',
              forClass: 'All',
              date: 'Aug 10',
            },
          ],
        };

        console.log('Selected child:', child);
        console.log('Child data:', data);

        return (
          <>
            <ChildInfoCard child={child} />
            <ChildSummaryCards child={{ ...child, ...data.stats }} />
            {/* Assignments */}
            <SectionTitle text='Assignments' className='mt-8 mb-2' />
            <div className='flex flex-col gap-2'>
              {data.assignments.map(
                (a: { id: string; title: string; status: string }) => (
                  <div
                    key={a.id}
                    className='bg-white rounded shadow p-3 flex justify-between items-center'
                  >
                    <span>{a.title}</span>
                    <span className='text-xs px-2 py-1 rounded bg-orange-100 text-orange-700'>
                      {a.status}
                    </span>
                  </div>
                ),
              )}
            </div>
            {/* Fees */}
            <SectionTitle text='Fees' className='mt-8 mb-2' />
            <div className='bg-white rounded shadow p-3 flex justify-between items-center'>
              <span>₹{data.stats.dueFees} Due</span>
            </div>
            {/* Recent Grades */}
            <SectionTitle text='Recent Grades' className='mt-8 mb-2' />
            <div className='flex flex-col gap-2'>
              {data.grades.map((g: { subject: string; value: string }) => (
                <div
                  key={g.subject}
                  className='bg-white rounded shadow p-3 flex justify-between items-center'
                >
                  <span>{g.subject}</span>
                  <span className='text-xs px-2 py-1 rounded bg-green-100 text-green-700'>
                    {g.value}
                  </span>
                </div>
              ))}
            </div>
            {/* Upcoming Events */}
            <SectionTitle text='Upcoming Events' className='mt-8 mb-2' />
            <UpcomingEventsPanel events={data.events} maxEvents={2} />
            {/* School Notices */}
            <SectionTitle text='School Notices' className='mt-8 mb-2' />
            <NoticesList notices={data.notices} />
          </>
        );
      })()}
    </div>
  );
}
