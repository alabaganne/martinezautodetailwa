'use client'

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Car, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronRight
} from 'lucide-react';
import { 
  useTodaysBookings, 
  useUpcomingBookings, 
  useBookingStats,
  useUpdateBookingStatus,
  useCancelBooking,
  useRefreshBookings
} from '@/hooks/useBookings';

const BookingCard = ({ booking, onStatusUpdate, onCancel }) => {
  const [updating, setUpdating] = useState(false);
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      case 'CANCELLED_BY_CUSTOMER':
      case 'CANCELLED_BY_SELLER': return 'bg-gray-100 text-gray-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const getDuration = () => {
    const minutes = booking.appointment_segments?.[0]?.duration_minutes || 60;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
  };
  
  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    await onStatusUpdate(booking.id, newStatus);
    setUpdating(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="text-gray-400" size={16} />
          <span className="font-semibold text-gray-900">{formatTime(booking.start_at)}</span>
          <span className="text-gray-500 text-sm">({getDuration()})</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {booking.status.replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="space-y-2">
        {booking.customer && (
          <div className="flex items-center space-x-2 text-sm">
            <User size={14} className="text-gray-400" />
            <span className="text-gray-700">
              {booking.customer.given_name} {booking.customer.family_name}
            </span>
          </div>
        )}
        
        {booking.customer?.phone_number && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone size={14} className="text-gray-400" />
            <a href={`tel:${booking.customer.phone_number}`} className="text-blue-600 hover:underline">
              {booking.customer.phone_number}
            </a>
          </div>
        )}
        
        {booking.customer?.email_address && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail size={14} className="text-gray-400" />
            <a href={`mailto:${booking.customer.email_address}`} className="text-blue-600 hover:underline">
              {booking.customer.email_address}
            </a>
          </div>
        )}
        
        {booking.appointment_segments?.[0] && (
          <div className="flex items-center space-x-2 text-sm">
            <Car size={14} className="text-gray-400" />
            <span className="text-gray-700">
              {booking.appointment_segments[0].service_variation_name || 'Service'}
            </span>
          </div>
        )}
      </div>
      
      {booking.status === 'PENDING' && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => handleStatusChange('ACCEPTED')}
            disabled={updating}
            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={() => handleStatusChange('DECLINED')}
            disabled={updating}
            className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}
      
      {booking.status === 'ACCEPTED' && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => onCancel(booking.id, 'Cancelled by admin')}
            disabled={updating}
            className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default function BookingsDashboard() {
  const { bookings: todaysBookings, loading: todayLoading } = useTodaysBookings();
  const { bookings: upcomingBookings, loading: upcomingLoading } = useUpcomingBookings(7);
  const stats = useBookingStats();
  const updateBookingStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();
  const refreshBookings = useRefreshBookings();
  
  const [selectedTab, setSelectedTab] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };
  
  const handleStatusUpdate = async (bookingId, newStatus) => {
    const result = await updateBookingStatus(bookingId, newStatus);
    if (result.success) {
      // Optionally show success toast
    } else {
      // Optionally show error toast
      console.error('Failed to update booking:', result.error);
    }
  };
  
  const handleCancel = async (bookingId, reason) => {
    const result = await cancelBooking(bookingId, reason);
    if (result.success) {
      // Optionally show success toast
    } else {
      // Optionally show error toast
      console.error('Failed to cancel booking:', result.error);
    }
  };
  
  if (todayLoading || upcomingLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="Today's Bookings" 
          value={stats.today.total} 
          icon={Calendar} 
          color="blue" 
        />
        <StatsCard 
          title="Upcoming Today" 
          value={stats.today.upcoming} 
          icon={Clock} 
          color="green" 
        />
        <StatsCard 
          title="Pending Approval" 
          value={stats.today.pending} 
          icon={AlertCircle} 
          color="yellow" 
        />
        <StatsCard 
          title="Total This Week" 
          value={upcomingBookings.length} 
          icon={ChevronRight} 
          color="gray" 
        />
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setSelectedTab('today')}
              className={`px-6 py-3 font-medium text-sm ${
                selectedTab === 'today' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Today ({todaysBookings.length})
            </button>
            <button
              onClick={() => setSelectedTab('upcoming')}
              className={`px-6 py-3 font-medium text-sm ${
                selectedTab === 'upcoming' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Next 7 Days ({upcomingBookings.length})
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {selectedTab === 'today' && (
            <div>
              {todaysBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600">No bookings for today</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todaysBookings.map(booking => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking}
                      onStatusUpdate={handleStatusUpdate}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedTab === 'upcoming' && (
            <div>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600">No upcoming bookings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group by date */}
                  {Object.entries(
                    upcomingBookings.reduce((acc, booking) => {
                      const date = new Date(booking.start_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(booking);
                      return acc;
                    }, {})
                  ).map(([date, bookings]) => (
                    <div key={date}>
                      <h3 className="font-semibold text-gray-900 mb-3">{date}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bookings.map(booking => (
                          <BookingCard 
                            key={booking.id} 
                            booking={booking}
                            onStatusUpdate={handleStatusUpdate}
                            onCancel={handleCancel}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}