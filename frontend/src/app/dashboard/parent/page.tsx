'use client';
import React, { useState, useEffect } from 'react';
import Avatar from '@/components/atoms/display/Avatar';
import { useAuth } from '@/hooks/useAuth';
import NoticesList from '../../../components/atoms/display/NoticesList';
import NotificationPanel from '@/components/organisms/dashboard/NotificationPanel';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { PageLoader } from '@/components/atoms/loading';
import { parentService, ParentResponse } from '@/api/services/parent.service';
import { LeaveRequestService } from '@/api/services/leave-request.service';
import { HttpClient } from '@/api/client/http-client';
import { noticeService } from '@/api/services/notice.service';
import { calendarService } from '@/api/services/calendar.service';
import { complaintService } from '@/api/services/complaint.service';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState<ParentResponse | null>(null);
  const [stats, setStats] = useState({
    childrenCount: 0,
    pendingRequests: 0,
    schoolNotices: 0,
    upcomingEvents: 0,
  });

  // State for real notices data
  const [recentNotices, setRecentNotices] = useState<any[]>([]);

  // State for complaints data
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);

  // Create service instances
  const leaveRequestService = new LeaveRequestService(new HttpClient());

  useEffect(() => {
    if (!user?.id) return;

    const fetchParentData = async () => {
      setLoading(true);
      try {
        // Use the parent service to get current parent data
        const response = await parentService.getMyProfile();

        if (response.success && response.data) {
          const parentData = response.data;
          setParentData(parentData);

          // Set children from the parent data
          const childrenData = parentData.children || [];
          setChildren(childrenData);

          // Fetch pending leave requests count
          let pendingCount = 0;
          try {
            const leaveResponse = await leaveRequestService.getLeaveRequests({
              status: 'PENDING_PARENT_APPROVAL',
              limit: 1000, // Get all to count them
            });

            if (leaveResponse.success && leaveResponse.data) {
              pendingCount = leaveResponse.data.leaveRequests.length;
            }
          } catch (leaveError) {
            console.error('Error fetching leave requests:', leaveError);
            // Don't fail the whole request, just use 0 for pending count
          }

          // Fetch notices count for this month and recent notices
          let thisMonthNoticesCount = 0;
          let recentNoticesData: any[] = [];
          try {
            const noticesResponse = await noticeService.getMyNotices({
              limit: 100, // Use a reasonable limit
              page: 1,
            });

            if (noticesResponse.success && noticesResponse.data) {
              const notices = noticesResponse.data.notices;
              const now = new Date();
              const startOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
              );

              // Count notices for this month
              thisMonthNoticesCount = notices.filter(notice => {
                const noticeDate = new Date(notice.publishDate);
                return noticeDate >= startOfMonth;
              }).length;

              // Get 5 most recent notices
              recentNoticesData = notices
                .sort(
                  (a, b) =>
                    new Date(b.publishDate).getTime() -
                    new Date(a.publishDate).getTime(),
                )
                .slice(0, 5)
                .map(notice => ({
                  id: notice.id,
                  title: notice.title,
                  forClass:
                    notice.recipientType === 'CLASS'
                      ? notice.selectedClass?.name || 'Class'
                      : notice.recipientType,
                  publishDate: notice.publishDate,
                  priority: notice.priority,
                }));
            }
          } catch (noticeError) {
            console.error('Error fetching notices:', noticeError);
            // Don't fail the whole request, just use 0 for notice count
            thisMonthNoticesCount = 0;
            recentNoticesData = [];
          }

          // Fetch upcoming events count for this month
          let thisMonthEventsCount = 0;
          try {
            const eventsResponse =
              await calendarService.getUpcomingEntries(100);

            if (eventsResponse && Array.isArray(eventsResponse)) {
              const now = new Date();
              const endOfMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
              );

              thisMonthEventsCount = eventsResponse.filter(event => {
                const eventDate = new Date(event.startDate);
                return eventDate >= now && eventDate <= endOfMonth;
              }).length;
            }
          } catch (eventError) {
            console.error('Error fetching events:', eventError);
            // Don't fail the whole request, just use 0 for event count
            thisMonthEventsCount = 0;
          }

          // Update stats with real data
          setStats({
            childrenCount: childrenData.length,
            pendingRequests: pendingCount,
            schoolNotices: thisMonthNoticesCount,
            upcomingEvents: thisMonthEventsCount,
          });

          // Set recent notices
          setRecentNotices(recentNoticesData);

          // Fetch complaints for current month
          let recentComplaintsData: any[] = [];
          try {
            const complaintsResponse = await complaintService.getAllComplaints({
              limit: 100,
              page: 1,
            });

            if (complaintsResponse.success && complaintsResponse.data) {
              const complaints = complaintsResponse.data.complaints;
              const now = new Date();
              const startOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
              );

              // Get complaints for current month
              recentComplaintsData = complaints
                .filter(complaint => {
                  const complaintDate = new Date(complaint.createdAt);
                  return complaintDate >= startOfMonth;
                })
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 5) // Show only 5 most recent
                .map(complaint => ({
                  id: complaint.id,
                  title: complaint.title,
                  message: complaint.description,
                  status: complaint.status,
                  category: complaint.type,
                  createdAt: complaint.createdAt,
                  priority: complaint.priority,
                }));
            }
          } catch (complaintError) {
            console.error('Error fetching complaints:', complaintError);
            recentComplaintsData = [];
          }

          // Set recent complaints
          setRecentComplaints(recentComplaintsData);
        } else {
          throw new Error('Failed to fetch parent data');
        }
      } catch (err) {
        console.error('Error fetching parent data:', err);
        setChildren([]);
        setStats({
          childrenCount: 0,
          pendingRequests: 0,
          schoolNotices: 0,
          upcomingEvents: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, [user?.id]);

  const parentName =
    parentData?.fullName || user?.full_name || user?.email || 'Parent';
  const parentEmail = parentData?.email || user?.email || 'parent@email.com';
  const parentPhone = parentData?.phone || '+91 98765 43210';
  const parentOccupation = parentData?.occupation || 'Parent';

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Parent Dashboard</h1>
        <p className='text-gray-600 text-base mt-1'>
          Comprehensive overview of your children&apos;s academic journey
        </p>
      </div>
      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='w-full space-y-6 mt-4'>
          {/* Stat Cards */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-6'>
            <div className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.childrenCount}
              </div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                Children
              </div>
            </div>
            <div
              className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center relative group cursor-pointer hover:shadow-lg transition-shadow duration-200'
              onClick={() =>
                (window.location.href = '/dashboard/parent/complaints-leaves')
              }
              title='Click to view pending leave requests'
            >
              <div className='text-2xl font-bold text-orange-500'>
                {stats.pendingRequests}
              </div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                Pending Requests
              </div>

              {/* Tooltip */}
              <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
                Leave requests waiting for your approval
                <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800'></div>
              </div>
            </div>
            <div
              className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow duration-200'
              onClick={() =>
                (window.location.href = '/dashboard/parent/notices')
              }
              title='Click to view school notices'
            >
              <div className='text-2xl font-bold text-green-600'>
                {stats.schoolNotices}
              </div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                School Notices
              </div>
              <div className='text-xs text-gray-500 mt-1 text-center'>
                This Month
              </div>
            </div>
            <div
              className='bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow duration-200'
              onClick={() =>
                (window.location.href = '/dashboard/parent/academics/calendar')
              }
              title='Click to view upcoming events'
            >
              <div className='text-2xl font-bold text-purple-500'>
                {stats.upcomingEvents}
              </div>
              <div className='text-base font-semibold mt-1 text-gray-700'>
                Upcoming Events
              </div>
              <div className='text-xs text-gray-500 mt-1 text-center'>
                This Month
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
                src={
                  parentData?.profilePhotoUrl ||
                  '/uploads/parents/profiles/parent.jpg'
                }
                name={parentName}
                className='w-12 h-12 rounded-full object-cover border'
              />
              <div>
                <div className='font-semibold text-gray-900'>{parentName}</div>
                <div className='text-gray-700'>
                  {parentEmail} • {parentPhone}
                </div>
                <div className='text-gray-700'>
                  {parentOccupation} • {parentData?.profile?.gender || 'Parent'}
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow p-6 mb-6'>
            <SectionTitle
              text={`Children Overview (${stats.childrenCount})`}
              className='text-lg font-bold mb-2'
            />
            <div className='flex flex-col gap-2'>
              {children.length === 0 ? (
                <div className='text-gray-500 text-center py-4'>
                  No children linked to your account.
                </div>
              ) : (
                children.map((child: any) => (
                  <div
                    key={child.id}
                    className='flex items-center gap-4 py-3 border-b last:border-b-0 hover:bg-gray-50 rounded-lg px-2'
                  >
                    <Avatar
                      src={child.profilePhotoUrl || ''}
                      name={child.fullName}
                      className='w-10 h-10 rounded-full object-cover border'
                    />
                    <div className='flex-1'>
                      <div className='font-semibold text-gray-900'>
                        {child.fullName}
                      </div>
                      <div className='text-gray-600 text-sm'>
                        Class{' '}
                        {(() => {
                          if (child.className) {
                            const parts = child.className.split('-');
                            if (parts.length >= 2) {
                              return `${parts[0]}-${parts[1]}`;
                            }
                            return parts[0];
                          }
                          return child.classId || 'N/A';
                        })()}{' '}
                        • Roll {child.rollNumber || 'N/A'}
                      </div>
                      <div className='text-gray-500 text-xs'>
                        {child.relationship}{' '}
                        {child.isPrimary ? '(Primary)' : ''}
                      </div>
                    </div>
                    <a
                      href={`/dashboard/parent/assignments?child=${child.studentId || child.id}`}
                      className='text-blue-600 hover:underline text-xs font-medium px-3 py-1 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors'
                    >
                      View Assignments
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* School Notices */}
          <div className='bg-white rounded-xl shadow p-6 mb-6'>
            <SectionTitle
              text={`School Notices (${stats.schoolNotices})`}
              className='text-lg font-bold mb-2'
            />

            {recentNotices.length === 0 ? (
              <div className='text-gray-500 text-center py-4'>
                No notices available for this month.
              </div>
            ) : (
              <div className='space-y-3'>
                {recentNotices.map(notice => (
                  <div
                    key={notice.id}
                    className='flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    {/* Priority indicator */}
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notice.priority === 'URGENT'
                          ? 'bg-red-500'
                          : notice.priority === 'HIGH'
                            ? 'bg-orange-500'
                            : notice.priority === 'MEDIUM'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                      }`}
                    />

                    <div className='flex-1 min-w-0'>
                      <h4 className='font-medium text-gray-900 text-sm line-clamp-2'>
                        {notice.title}
                      </h4>
                      <div className='flex items-center gap-2 mt-1 text-xs text-gray-500'>
                        <span className='bg-gray-100 px-2 py-1 rounded'>
                          {notice.forClass}
                        </span>
                        <span>
                          {new Date(notice.publishDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* View all notices link */}
                <div className='text-center pt-2'>
                  <a
                    href='/dashboard/parent/notices'
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline'
                  >
                    View All Notices →
                  </a>
                </div>
              </div>
            )}
          </div>
          {/* Complaints */}
          <div className='bg-white rounded-xl shadow p-6 mb-6'>
            <SectionTitle
              text='Complaints'
              className='text-lg font-bold mb-2'
            />

            {recentComplaints.length === 0 ? (
              <div className='text-gray-500 text-center py-4'>
                No complaints for this month.
              </div>
            ) : (
              <div className='space-y-3'>
                {recentComplaints.map(complaint => (
                  <div
                    key={complaint.id}
                    className='flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    {/* Status indicator */}
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        complaint.status === 'RESOLVED'
                          ? 'bg-green-500'
                          : complaint.status === 'IN_PROGRESS'
                            ? 'bg-blue-500'
                            : complaint.status === 'OPEN'
                              ? 'bg-yellow-500'
                              : complaint.status === 'CLOSED'
                                ? 'bg-gray-500'
                                : 'bg-red-500'
                      }`}
                    />

                    <div className='flex-1 min-w-0'>
                      <h4 className='font-medium text-gray-900 text-sm line-clamp-2'>
                        {complaint.title}
                      </h4>
                      {complaint.status === 'OPEN' && (
                        <p className='text-xs text-amber-600 mt-1 italic'>
                          Please resolve this complaint soon
                        </p>
                      )}
                      <div className='flex items-center gap-2 mt-1 text-xs text-gray-500'>
                        <span className='bg-gray-100 px-2 py-1 rounded'>
                          {complaint.category}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            complaint.status === 'RESOLVED'
                              ? 'bg-green-100 text-green-800'
                              : complaint.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : complaint.status === 'OPEN'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : complaint.status === 'CLOSED'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {complaint.status}
                        </span>
                        <span>
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* View all complaints link */}
                <div className='text-center pt-2'>
                  <a
                    href='/dashboard/parent/complaints-leaves'
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline'
                  >
                    View All Complaints →
                  </a>
                </div>
              </div>
            )}
          </div>
          {/* Quick Actions */}
        </div>
      </div>
    </div>
  );
}
