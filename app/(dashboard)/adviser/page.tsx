'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import { FiUsers, FiFolder, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/components/Calendar.css'
import CustomToolBar from '@/components/CalendarToolBar';
import { useState } from 'react';
import { MOCK_ADVISER_STATS } from '@/lib/mock-data';

export default function AdviserDashboardPage() {
  const router = useRouter();
  const { user, isLoading, handleLogout } = useDashboardUser('Adviser');

  const localizer = momentLocalizer(moment);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const eventList = [
    {
      title: 'Board Meeting',
      start: new Date(2026, 2, 20, 10, 0), // Year, Month (0-indexed), Day, Hour, Min
      end: new Date(2026, 2, 20, 12, 0),
    },
  ];

  const stats = [
    { icon: <FiUsers />, label: 'Total Advisees', value: String(MOCK_ADVISER_STATS.totalAdvisees), color: 'bg-accent-100 text-accent-600' },
    { icon: <FiFolder />, label: 'Active Projects', value: String(MOCK_ADVISER_STATS.activeProjects), color: 'bg-success-100 text-success-600' },
    { icon: <FiCalendar />, label: 'Upcoming Defenses', value: String(MOCK_ADVISER_STATS.upcomingDefenses), color: 'bg-warning-100 text-warning-600', href: '/adviser/schedule' },
    { icon: <FiTrendingUp />, label: 'Completed Projects', value: String(MOCK_ADVISER_STATS.completedProjects), color: 'bg-primary-100 text-primary-600' },
  ];

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading...</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold text-primary-700">Welcome back, {user.name}!</h1>
              <p className="text-neutral-600 mt-1">Here's an overview of your advisees and projects</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-row-2 lg:grid-cols-4  gap-6">
              {stats.map((stat, idx) => (
                <Card key={idx} padding="md">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <div className="text-2xl">{stat.icon}</div>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Combined Cards */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='grid grid-row gap-6'>
                {/* Join a Group Section */}
                <JoinGroupCard />

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <Card>
                    <CardTitle>Pending Reviews</CardTitle>
                    <CardDescription>Documents awaiting your feedback</CardDescription>
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-neutral-600">No pending reviews</p>
                    </div>
                  </Card>
                </div>
              </div>  

              <Card>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your advisees</CardDescription>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-neutral-600">No recent activity</p>
                </div>
              </Card>
            </div>  

            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <JoinGroupCard />

              <Card>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your advisees</CardDescription>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-neutral-600">No recent activity</p>
                </div>
              </Card>
            </div>           

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>Documents awaiting your feedback</CardDescription>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-neutral-600">No pending reviews</p>
                </div>
              </Card>
            </div> */}

            <Card>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Schedule of defenses and meetings</CardDescription>
              <div className="mt-4 h-96 rounded-lg border border-neutral-200 overflow-hidden bg-white">
                <Calendar
                  localizer={localizer}
                  events={eventList}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  date={currentDate}
                  view={currentView}
                  onNavigate={(date: Date) => setCurrentDate(date)}
                  onView={(view: string) => setCurrentView(view)}
                  components={{
                    toolbar: CustomToolBar,
                  }}
                />
              </div>
            </Card>

          </>
        )}
      </div>
    </DashboardLayout>
  );
}