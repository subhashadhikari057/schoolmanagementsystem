import React from 'react';
import Statsgrid from '@/components/organisms/Statsgrid';
import { Users, GraduationCap, DollarSign, CreditCard } from 'lucide-react';
import UpcomingEvents from '@/components/organisms/UpcomingEvents';
import Notifications from '@/components/organisms/Notification';
import QuickActions from '@/components/organisms/QuickAction';

const statsData = [
  {
    icon: Users,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    value: "2,856",
    label: "Total Students",
    change: "3.1%",
    isPositive: true
  },
  {
    icon: GraduationCap,
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    value: "182",
    label: "Total Teachers",
    change: "1.8%",
    isPositive: true
  },
  {
    icon: DollarSign,
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
    value: "$428,560",
    label: "Total Fees Collected",
    change: "5.2%",
    isPositive: true
  },
  {
    icon: CreditCard,
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
    value: "$215,400",
    label: "Total Salaries Paid",
    change: "2.4%",
    isPositive: false
  }
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <h1 className="text-xl md:text-2xl mt-1 font-bold">Super Admin Dashboard</h1>
      <h6 className="text-xs md:text-base my-2 text-muted">Welcome back! Here's what's happening with your school today.</h6>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Statsgrid stats={statsData} />
        </div>
        <div className='grid grid-cols-12 gap-5 my-8'>
          <div className='col-span-12 md:col-span-8'>
            <UpcomingEvents events={[]} className='w-full' />
          </div>
          <div className='col-span-12 md:col-span-4'>
            <Notifications notifications={[]} />
          </div>
          <div className='col-span-12'>
            <QuickActions actions={[]} />
          </div>
        </div>

      </div>
    </div>
  );
}