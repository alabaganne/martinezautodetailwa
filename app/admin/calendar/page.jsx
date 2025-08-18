'use client'

import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { Calendar, Clock, User, Car } from 'lucide-react';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  
  const { bookings, loading } = useBookings({
    startDate: startOfMonth.toISOString(),
    endDate: endOfMonth.toISOString()
  });
  
  const getDaysInMonth = () => {
    const days = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    // Add padding days from previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Add padding days from next month
    const endPadding = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };
  
  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => 
      booking.start_at.startsWith(dateStr)
    );
  };
  
  const formatMonthYear = () => {
    return selectedDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Calendar className="animate-pulse" size={48} />
        </div>
      </div>
    );
  }
  
  const days = getDaysInMonth();
  
  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-2">View bookings in calendar format</p>
      </div>
      
      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {formatMonthYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Today
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-3 py-3 bg-gray-50 border-b border-r border-gray-200 text-center">
              <span className="text-xs font-medium text-gray-700 uppercase">{day}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {days.map(({ date, isCurrentMonth }, index) => {
            const dayBookings = getBookingsForDate(date);
            const hasBookings = dayBookings.length > 0;
            
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border-b border-r border-gray-200 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${isToday(date) ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                  } ${isToday(date) ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </span>
                  {hasBookings && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                      {dayBookings.length}
                    </span>
                  )}
                </div>
                
                {hasBookings && (
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking, idx) => (
                      <div
                        key={booking.id}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                        title={`${new Date(booking.start_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })} - ${booking.customer?.given_name} ${booking.customer?.family_name}`}
                      >
                        {new Date(booking.start_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          hour12: true 
                        })} - {booking.customer?.given_name}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex items-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-50 border border-gray-300 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span>Has Bookings</span>
        </div>
      </div>
    </div>
  );
}